// services/whatsapp/baileysManager.ts
import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    WASocket,
    proto,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from "baileys";
import { Boom } from '@hapi/boom';
import { EventEmitter } from 'events';
import P from 'pino';

interface BaileysClientInfo
{
    socket: WASocket | null;
    isReady: boolean;
    qrCode?: string;
    retryCount: number;
}

export class BaileysManager extends EventEmitter
{
    private clients: Map<string, BaileysClientInfo> = new Map();
    private readonly MAX_RETRIES = 5;
    private readonly logger = P({ level: 'silent' }); // Set to 'debug' for logs

    async createClient(organizationId: string): Promise<void>
    {
        if (this.clients.has(organizationId)) {
            throw new Error('Client already exists');
        }

        const clientInfo: BaileysClientInfo = {
            socket: null,
            isReady: false,
            qrCode: undefined,
            retryCount: 0
        };

        this.clients.set(organizationId, clientInfo);
        await this.initializeSocket(organizationId);
    }

    private async initializeSocket(organizationId: string)
    {
        const clientInfo = this.clients.get(organizationId);
        if (!clientInfo) return;

        try {
            // Load saved session
            const { state, saveCreds } = await useMultiFileAuthState(
                `./auth_sessions/${organizationId}`
            );

            const { version, isLatest } = await fetchLatestBaileysVersion();
            console.log(`Using Baileys v${version.join('.')}, isLatest: ${isLatest}`);

            const sock = makeWASocket({
                version,
                logger: this.logger,
                printQRInTerminal: false,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, this.logger),
                },
                browser: [ 'YourSalesBot', 'Chrome', '10.0' ],
                getMessage: async (key) =>
                {
                    // Return message from your database if needed
                    return { conversation: '' };
                }
            });

            clientInfo.socket = sock;

            // Save credentials when updated
            sock.ev.on('creds.update', saveCreds);

            // Handle connection updates
            sock.ev.on('connection.update', async (update) =>
            {
                await this.handleConnectionUpdate(organizationId, update);
            });

            // Handle incoming messages
            sock.ev.on('messages.upsert', async (m) =>
            {
                await this.handleIncomingMessages(organizationId, m);
            });

            // Handle message status updates (read receipts, delivery, etc.)
            sock.ev.on('messages.update', (updates) =>
            {
                console.log('Message updates:', updates);
            });

        } catch (error) {
            console.error(`Error initializing socket for ${organizationId}:`, error);
            this.emit('error', { organizationId, error });
        }
    }

    private async handleConnectionUpdate(
        organizationId: string,
        update: any
    )
    {
        const clientInfo = this.clients.get(organizationId);
        if (!clientInfo) return;

        const { connection, lastDisconnect, qr } = update;

        // QR code for scanning
        if (qr) {
            clientInfo.qrCode = qr;
            this.emit('qr', { organizationId, qr });
        }

        // Connection opened successfully
        if (connection === 'open') {
            console.log(`WhatsApp connected for org ${organizationId}`);
            clientInfo.isReady = true;
            clientInfo.qrCode = undefined;
            clientInfo.retryCount = 0;
            this.emit('ready', { organizationId });
        }

        // Connection closed
        if (connection === 'close') {
            clientInfo.isReady = false;

            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log(`Connection closed for ${organizationId}. Status: ${statusCode}`);

            if (statusCode === DisconnectReason.loggedOut) {
                // User logged out - require re-authentication
                this.emit('logged_out', { organizationId });
                clientInfo.socket = null;
            } else if (shouldReconnect && clientInfo.retryCount < this.MAX_RETRIES) {
                // Retry connection
                clientInfo.retryCount++;
                console.log(`Reconnecting (attempt ${clientInfo.retryCount})...`);

                setTimeout(() =>
                {
                    this.initializeSocket(organizationId);
                }, 3000 * clientInfo.retryCount); // Exponential backoff
            } else {
                console.error(`Max retries reached for ${organizationId}`);
                this.emit('max_retries', { organizationId });
            }
        }
    }

    private async handleIncomingMessages(organizationId: string, m: any)
    {
        const clientInfo = this.clients.get(organizationId);
        if (!clientInfo || !clientInfo.isReady) return;

        for (const msg of m.messages) {
            // Skip messages from self
            if (msg.key.fromMe) continue;

            // Skip messages that aren't new
            if (m.type !== 'notify') continue;

            const messageType = Object.keys(msg.message || {})[ 0 ];
            let text = '';

            // Extract text from different message types
            if (msg.message?.conversation) {
                text = msg.message.conversation;
            } else if (msg.message?.extendedTextMessage?.text) {
                text = msg.message.extendedTextMessage.text;
            } else if (msg.message?.imageMessage?.caption) {
                text = msg.message.imageMessage.caption;
            }

            // Emit message event
            this.emit('message', {
                organizationId,
                from: msg.key.remoteJid, // e.g., "2348012345678@s.whatsapp.net"
                text,
                messageId: msg.key.id,
                timestamp: msg.messageTimestamp,
                messageType,
                fullMessage: msg
            });
        }
    }

    async sendMessage(
        organizationId: string,
        to: string,
        text: string
    ): Promise<void>
    {
        const clientInfo = this.clients.get(organizationId);
        if (!clientInfo?.socket || !clientInfo.isReady) {
            throw new Error('WhatsApp client not ready');
        }

        // Format phone number (e.g., "2348012345678@s.whatsapp.net")
        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

        await clientInfo.socket.sendMessage(jid, {
            text
        });
    }

    async sendMediaMessage(
        organizationId: string,
        to: string,
        mediaUrl: string,
        caption?: string
    ): Promise<void>
    {
        const clientInfo = this.clients.get(organizationId);
        if (!clientInfo?.socket || !clientInfo.isReady) {
            throw new Error('WhatsApp client not ready');
        }

        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

        await clientInfo.socket.sendMessage(jid, {
            image: { url: mediaUrl },
            caption
        });
    }

    getClient(organizationId: string): BaileysClientInfo | undefined
    {
        return this.clients.get(organizationId);
    }

    async disconnectClient(organizationId: string): Promise<void>
    {
        const clientInfo = this.clients.get(organizationId);
        if (clientInfo?.socket) {
            await clientInfo.socket.logout();
            clientInfo.socket = null;
            clientInfo.isReady = false;
        }
        this.clients.delete(organizationId);
    }

    isClientReady(organizationId: string): boolean
    {
        const clientInfo = this.clients.get(organizationId);
        return clientInfo?.isReady || false;
    }
}

// Singleton instance
export const baileysManager = new BaileysManager();
