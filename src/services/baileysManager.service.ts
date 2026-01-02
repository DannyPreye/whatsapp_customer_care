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
import { OrganizationModel } from '../models/organization.model';
import { CustomerModel } from '../models/customer.model';
import { ConversationModel } from '../models/conversation.model';
import { MessageModel } from '../models/message.model';
import { Direction, MessageType, MessageStatus } from '../models/enums';
import { SalesAgent } from './agents/salesAgenet.agent';

interface BaileysClientInfo
{
    socket: WASocket | null;
    isReady: boolean;
    qrCode?: string;
    retryCount: number;
    heartbeatInterval?: NodeJS.Timeout;
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
            console.log(`[Baileys] Starting socket initialization for org: ${organizationId}`);

            // Load saved session
            const { state, saveCreds } = await useMultiFileAuthState(
                `./auth_sessions/${organizationId}`
            );

            const { version, isLatest } = await fetchLatestBaileysVersion();
            console.log(`[Baileys] Using Baileys v${version.join('.')}, isLatest: ${isLatest}`);

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
            console.log(`[Baileys] Socket created for org: ${organizationId}`);

            // Save credentials when updated
            sock.ev.on('creds.update', saveCreds);
            console.log(`[Baileys] Creds update handler registered`);

            // Handle connection updates (single handler that handles everything)
            sock.ev.on('connection.update', async (update) =>
            {
                console.log(`[Baileys] Connection update event fired:`, JSON.stringify(update, null, 2));
                const { connection, isOnline, qr, lastDisconnect } = update;

                // Log online status
                if (isOnline !== undefined) {
                    console.log(`[Baileys] Socket online status for org ${organizationId}: ${isOnline}`);
                }

                // Log connection state
                if (connection) {
                    console.log(`[Baileys] Connection state for org ${organizationId}: ${connection}`);
                }

                // Let the main handler process everything
                await this.handleConnectionUpdate(organizationId, update);
            });

            // Handle incoming messages - THIS IS CRITICAL
            sock.ev.on('messages.upsert', async (m) =>
            {
                console.log(`[Baileys] *** MESSAGES.UPSERT EVENT FIRED ***`);
                console.log(`[Baileys] Event type: ${m.type}, Message count: ${m.messages?.length || 0}`);
                await this.handleIncomingMessages(organizationId, m);
            });

            // Handle message status updates (read receipts, delivery, etc.)
            sock.ev.on('messages.update', (updates) =>
            {
                console.log(`[Baileys] Message status updates for org ${organizationId}:`, updates);
            });

            // Additional socket events for debugging
            sock.ev.on('chats.upsert', (chats) =>
            {
                console.log(`[Baileys] New chats upserted for org ${organizationId}: ${chats.length}`);
            });

            sock.ev.on('contacts.update', (contacts) =>
            {
                console.log(`[Baileys] Contacts updated for org ${organizationId}: ${contacts.length}`);
            });

            console.log(`[Baileys] Socket initialization COMPLETE for org ${organizationId}`);
            console.log(`[Baileys] Waiting for WhatsApp connection (scan QR code)...`);

        } catch (error) {
            console.error(`[Baileys] Error initializing socket for ${organizationId}:`, error);
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

        console.log(`[Baileys] Connection update for org ${organizationId}: ${JSON.stringify({ connection, qr: qr ? 'present' : 'absent' })}`);

        // QR code for scanning
        if (qr) {
            clientInfo.qrCode = qr;
            console.log(`[Baileys] QR code generated for org: ${organizationId}`);
            this.emit('qr', { organizationId, qr });
        }

        // Connection opened successfully
        if (connection === 'open') {
            console.log(`\n[Baileys] ╔════════════════════════════════════════╗`);
            console.log(`[Baileys] ║  ✅ WhatsApp CONNECTED SUCCESSFULLY  ║`);
            console.log(`[Baileys] ╚════════════════════════════════════════╝\n`);
            console.log(`[Baileys] Organization: ${organizationId}`);

            clientInfo.isReady = true;
            clientInfo.qrCode = undefined;
            clientInfo.retryCount = 0;

            await this.markOrganizationAsConnected(organizationId);
            this.emit('ready', { organizationId });

            // Start a heartbeat to keep the connection alive
            console.log(`[Baileys] Starting heartbeat monitor for org ${organizationId}`);
            this.startConnectionHeartbeat(organizationId, clientInfo.socket);
        }

        // Connection closed
        if (connection === 'close') {
            console.log(`[Baileys] Connection closed for org ${organizationId}`);
            clientInfo.isReady = false;

            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log(`[Baileys] Disconnect status code for ${organizationId}: ${statusCode}`);

            if (statusCode === DisconnectReason.loggedOut) {
                // User logged out - require re-authentication
                console.log(`[Baileys] User logged out from org: ${organizationId}`);
                this.emit('logged_out', { organizationId });
                clientInfo.socket = null;
                await this.updateOrganizationConnectionStatus(organizationId, 'disconnected');
            } else if (shouldReconnect && clientInfo.retryCount < this.MAX_RETRIES) {
                // Retry connection
                clientInfo.retryCount++;
                console.log(`[Baileys] Reconnecting for org ${organizationId} (attempt ${clientInfo.retryCount}/${this.MAX_RETRIES})`);

                setTimeout(() =>
                {
                    this.initializeSocket(organizationId);
                }, 3000 * clientInfo.retryCount); // Exponential backoff
            } else {
                console.error(`[Baileys] Max retries reached for org: ${organizationId}`);
                await this.updateOrganizationConnectionStatus(organizationId, 'disconnected');
                this.emit('max_retries', { organizationId });
            }
        }
    }

    private async handleIncomingMessages(organizationId: string, m: any)
    {
        console.log(`\n[Baileys] ╔════════════════════════════════════════╗`);
        console.log(`[Baileys] ║  INCOMING MESSAGE HANDLER TRIGGERED  ║`);
        console.log(`[Baileys] ╚════════════════════════════════════════╝\n`);

        // console.log("message", m);

        const clientInfo = this.clients.get(organizationId);
        if (!clientInfo) {
            console.log(`[Baileys] ❌ CRITICAL: Client info not found for org: ${organizationId}`);
            return;
        }

        console.log(`[Baileys] ✓ Client info found for org: ${organizationId}`);
        console.log(`[Baileys] ✓ IsReady: ${clientInfo.isReady}`);
        console.log(`[Baileys] ✓ Message event type: ${m.type}`);
        console.log(`[Baileys] ✓ Message count: ${m.messages?.length || 0}`);

        if (!m.messages || m.messages.length === 0) {
            console.log(`[Baileys] ⚠ No messages in event, returning`);
            return;
        }



        for (const msg of m.messages) {
            try {
                console.log(`\n[Baileys] ─────────────────────────────────`);
                console.log(`[Baileys] Processing message:`, msg);

                // Skip messages from self
                if (msg.key.fromMe) {
                    console.log(`[Baileys] ⊘ SKIP: Message from self`);
                    continue;
                }

                // Skip messages that aren't new notifications
                if (m.type !== 'notify') {
                    console.log(`[Baileys] ⊘ SKIP: Event type is '${m.type}', not 'notify'`);
                    continue;
                }

                // Skip group messages
                if (msg.key.remoteJidAlt.endsWith('@g.us')) {
                    console.log(`[Baileys] ⊘ SKIP: Group message from ${msg.key.remoteJid}`);
                    continue;
                }

                if (!msg.message) {
                    console.log(`[Baileys] ⊘ SKIP: Message object is empty`);
                    continue;
                }

                // Extract message type and text
                const messageType = Object.keys(msg.message)[ 0 ];
                let text = '';

                console.log(`[Baileys] 📨 Message type: ${messageType}`);

                // Extract text from different message types
                if (msg.message?.conversation) {
                    text = msg.message.conversation;
                } else if (msg.message?.extendedTextMessage?.text) {
                    text = msg.message.extendedTextMessage.text;
                } else if (msg.message?.imageMessage?.caption) {
                    text = msg.message.imageMessage.caption;
                } else if (msg.message?.videoMessage?.caption) {
                    text = msg.message.videoMessage.caption;
                }

                // Skip if no text was extracted
                if (!text || text.trim().length === 0) {
                    console.log(`[Baileys] ⊘ SKIP: No text extracted from type: ${messageType}`);
                    continue;
                }

                console.log(`[Baileys] ✅ VALID MESSAGE ACCEPTED`);
                console.log(`[Baileys] → From: ${msg.key.remoteJid}`);
                console.log(`[Baileys] → Text: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
                console.log(`[Baileys] → Timestamp: ${msg.messageTimestamp}`);
                console.log(`[Baileys] → MessageId: ${msg.key.id}`);
                console.log(`[Baileys] ─────────────────────────────────\n`);

                // Process message
                await this.processIncomingMessage({
                    organizationId,
                    from: msg.key.remoteJidAlt,
                    text,
                    messageId: msg.key.id,
                    timestamp: msg.messageTimestamp,
                    messageType,
                    pushName: msg.pushName || 'Unknown'
                });

                // Emit message event for other listeners
                this.emit('message', {
                    organizationId,
                    from: msg.key.remoteJidAlt,
                    text,
                    messageId: msg.key.id,
                    timestamp: msg.messageTimestamp,
                    messageType,
                    fullMessage: msg
                });
            } catch (msgError) {
                console.error(`[Baileys] Error processing individual message:`, msgError);
            }
        }
    }

    /**
     * Process incoming message - create customer, conversation, and trigger SalesAgent
     */
    private async processIncomingMessage(data: {
        organizationId: string;
        from: string;
        text: string;
        messageId: string;
        timestamp: number;
        messageType: string;
        pushName: string;
    }): Promise<void>
    {
        try {
            const { organizationId, from, text, messageId, pushName } = data;

            console.log(`\n[Baileys] ╔════════════════════════════════════════╗`, data);

            console.log(`[Baileys] Processing incoming message for org: ${organizationId}`);

            // Extract phone number from JID (e.g., "2348012345678@s.whatsapp.net" -> "2348012345678")
            const whatsappNumber = from.split('@')[ 0 ];
            console.log(`[Baileys] Extracted WhatsApp number: ${whatsappNumber}`);

            // Find or create customer
            let customer = await CustomerModel.findOne({
                whatsappNumber,
                organizationId
            }).lean();

            if (!customer) {
                console.log(`[Baileys] Creating new customer: ${whatsappNumber}`);
                const createdCustomer = await CustomerModel.create({
                    organizationId,
                    whatsappNumber,
                    name: pushName || 'Unknown'
                } as any);
                customer = Array.isArray(createdCustomer) ? createdCustomer[ 0 ] : createdCustomer;
                console.log(`[Baileys] New customer created: ${customer._id}`);
            } else {
                console.log(`[Baileys] Customer found: ${customer._id}`);
            }

            // Find or create conversation
            let conversation = await ConversationModel.findOne({
                organizationId,
                customerId: customer._id,
                status: 'ACTIVE'
            }).lean();

            let conversationId: string;
            if (!conversation) {
                // console.log(`[Baileys] Creating new conversation for customer: ${customer._id}`);
                const created = await ConversationModel.create({
                    organizationId,
                    customerId: customer._id,
                    status: 'ACTIVE',
                    priority: 'MEDIUM',
                    metadata: { from: whatsappNumber, authType: 'baileys' }
                } as any);
                const createdDoc = Array.isArray(created) ? created[ 0 ] : created;
                conversationId = (createdDoc as any)._id as string;
                // console.log(`[Baileys] New conversation created: ${conversationId}`);

                // Mark customer as having started a conversation
                await CustomerModel.updateOne({ _id: customer._id }, { $set: { hasStartedConversation: true } });
            } else {
                conversationId = conversation._id as string;
                // console.log(`[Baileys] Existing conversation found: ${conversationId}`);
            }

            // Save incoming message
            const createdMsg = await MessageModel.create({
                conversationId,
                whatsappId: messageId,
                direction: Direction.INBOUND,
                type: MessageType.TEXT,
                content: text,
                metadata: { authType: 'baileys' },
                status: MessageStatus.DELIVERED,
                isFromAgent: false,
                aiGenerated: false
            } as any);
            const savedMessageDoc = Array.isArray(createdMsg) ? createdMsg[ 0 ] : createdMsg;
            console.log(`[Baileys] Message saved to DB: ${(savedMessageDoc as any)._id}`);

            // Prepare data for SalesAgent
            const formatMessageForAi = {
                conversationId,
                organization: organizationId,
                customer: {
                    id: customer._id,
                    name: customer.name,
                    whatsappNumber: customer.whatsappNumber
                },
                customerMessage: text,
                authType: 'baileys' // Mark as Baileys for routing
            };

            // Trigger SalesAgent asynchronously
            setImmediate(async () =>
            {
                try {
                    console.log(`[Baileys] Triggering SalesAgent for conversation: ${conversationId}`);
                    const salesAgent = new SalesAgent();
                    const response = await salesAgent.handleRequest(JSON.stringify(formatMessageForAi));
                    console.log(`[Baileys] SalesAgent response received`);
                } catch (error) {
                    console.error('[Baileys] Error handling sales agent request:', error);
                }
            });

            console.log(`[Baileys] Message processing complete for conversation: ${conversationId}`);
        } catch (error) {
            console.error('[Baileys] Error processing incoming Baileys message:', error);
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

        // Update organization status to disconnected
        await this.updateOrganizationConnectionStatus(organizationId, 'disconnected');
    }

    isClientReady(organizationId: string): boolean
    {
        const clientInfo = this.clients.get(organizationId);
        return clientInfo?.isReady || false;
    }

    /**
     * Check if a WhatsApp client has been disconnected
     * @param organizationId The organization ID
     * @returns true if disconnected, false if connected or not found
     */
    isClientDisconnected(organizationId: string): boolean
    {
        const clientInfo = this.clients.get(organizationId);
        if (!clientInfo) return true; // Not found = disconnected
        return !clientInfo.isReady;
    }

    /**
     * Update organization's WhatsApp connection status
     * @param organizationId The organization ID
     * @param status The connection status
     */
    private async updateOrganizationConnectionStatus(
        organizationId: string,
        status: 'connected' | 'disconnected' | 'pending'
    ): Promise<void>
    {
        try {
            await OrganizationModel.findByIdAndUpdate(
                organizationId,
                { whatsappConnectionStatus: status },
                { new: true }
            ).exec();
        } catch (error) {
            console.error(`Failed to update organization ${organizationId} connection status:`, error);
        }
    }

    /**
     * Mark organization as connected when WhatsApp is ready
     * @param organizationId The organization ID
     */
    private async markOrganizationAsConnected(organizationId: string): Promise<void>
    {
        await this.updateOrganizationConnectionStatus(organizationId, 'connected');
    }

    /**
     * Start heartbeat monitoring to keep the socket connection alive
     * @param organizationId The organization ID
     * @param socket The Baileys socket instance
     */
    private startConnectionHeartbeat(organizationId: string, socket: any): void
    {
        // Monitor connection health every 30 seconds
        const heartbeatInterval = setInterval(() =>
        {
            const clientInfo = this.clients.get(organizationId);

            if (!clientInfo) {
                console.log(`[Baileys] Clearing heartbeat - client not found for ${organizationId}`);
                clearInterval(heartbeatInterval);
                return;
            }

            if (!clientInfo.isReady) {
                console.log(`[Baileys] Heartbeat: Connection NOT READY for ${organizationId}`);
                clearInterval(heartbeatInterval);
                return;
            }

            console.log(`[Baileys] ♥ Heartbeat: Connection ACTIVE for ${organizationId}`);
            console.log(`[Baileys] ♥ Socket status: ${socket ? 'Connected' : 'Disconnected'}`);
            console.log(`[Baileys] ♥ Ready to receive messages`);
        }, 30000); // Every 30 seconds

        // Store interval reference for cleanup
        const clientInfo = this.clients.get(organizationId);
        if (clientInfo) {
            clientInfo.heartbeatInterval = heartbeatInterval;
        }
    }

    /**
     * Disconnect all active Baileys connections (called on server shutdown)
     */
    public async disconnectAll(): Promise<void>
    {
        console.log(`[Baileys] Disconnecting all ${this.clients.size} active connections...`);

        for (const [ organizationId, clientInfo ] of this.clients.entries()) {
            try {
                // Clear heartbeat interval
                if (clientInfo.heartbeatInterval) {
                    clearInterval(clientInfo.heartbeatInterval);
                }

                // Close socket connection
                if (clientInfo.socket) {
                    await clientInfo.socket.logout();
                    console.log(`[Baileys] ✓ Disconnected org: ${organizationId}`);
                }

                // Update organization status
                await this.updateOrganizationConnectionStatus(organizationId, 'disconnected');
            } catch (error) {
                console.error(`[Baileys] Error disconnecting org ${organizationId}:`, error);
            }
        }

        // Clear all clients
        this.clients.clear();
        console.log(`[Baileys] All connections cleaned up`);
    }
}

// Singleton instance
export const baileysManager = new BaileysManager();
