import { Request, Response } from 'express';
import * as orgService from '../services/organizations.service';
import { ok, created, noContent } from '../utils/response';
import crypto from 'crypto';
import { WhatsappAuthService } from '../services/whatsappAuth.service';
import * as oauthStateService from '../services/oauthState.service';
import { baileysManager } from '../services/baileysManager.service';

export async function list(_req: Request, res: Response)
{
    const orgs = await orgService.listOrganizations();
    ok(res, orgs);
}

export async function create(req: Request, res: Response)
{
    const org = await orgService.createOrganization(req.body);
    created(res, org);
}

export async function getById(req: Request, res: Response)
{
    const org = await orgService.getOrganizationById(req.params.id);
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    ok(res, org);
}

export async function update(req: Request, res: Response)
{
    const org = await orgService.updateOrganization(req.params.id, req.body);
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    ok(res, org);
}

export async function remove(req: Request, res: Response)
{
    const deleted = await orgService.deleteOrganization(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Organization not found' });
    noContent(res);
}

export async function getSettings(req: Request, res: Response)
{
    const settings = await orgService.getSettings(req.params.id);
    if (!settings) return res.status(404).json({ error: 'Organization not found' });
    ok(res, settings);
}

export async function updateSettings(req: Request, res: Response)
{
    const settings = await orgService.updateSettings(req.params.id, req.body);
    if (!settings) return res.status(404).json({ error: 'Organization not found' });
    ok(res, settings);
}

export async function getAgentSettings(req: Request, res: Response)
{
    const settings = await orgService.getAgentSettings(req.params.id);
    if (!settings) return res.status(404).json({ error: 'Organization not found' });
    ok(res, settings);
}

export async function updateAgentSettings(req: Request, res: Response)
{
    const settings = await orgService.updateAgentSettings(req.params.id, req.body);
    if (!settings) return res.status(404).json({ error: 'Organization not found' });
    ok(res, settings);
}


export async function initWhatsAppOAuth(req: Request, res: Response)
{
    try {
        const organizationId = req.params.id;
        const org = await orgService.getOrganizationById(organizationId);
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        // Generate secure state token
        const state = crypto.randomBytes(32).toString('hex');
        await oauthStateService.createState(state, organizationId);

        const auth = new WhatsappAuthService();
        const authUrl = auth.getAuthorizationUrl(state);

        return res.json({
            authUrl,
            message: 'Redirect user to this URL to authorize WhatsApp access'
        });
    } catch (error) {
        console.error('initWhatsAppOAuth error', error);
        return res.status(500).json({ error: 'Failed to initiate WhatsApp OAuth' });
    }
}


export async function getWhatsAppOptions(req: Request, res: Response)
{
    try {
        const { state } = req.query as Record<string, string>;
        if (!state) return res.status(400).json({ error: 'Missing state parameter' });

        const stored = await oauthStateService.getState(state);
        if (!stored) return res.status(400).json({ error: 'Invalid or expired state' });

        const age = Date.now() - new Date(stored.createdAt).getTime();
        if (age > 10 * 60 * 1000) {
            await oauthStateService.deleteState(state);
            return res.status(400).json({ error: 'State expired, reinitiate OAuth flow' });
        }

        // Token should be stored in state
        const accessToken = stored.accessToken as string;
        if (!accessToken) return res.status(400).json({ error: 'No access token found' });

        const auth = new WhatsappAuthService();
        const wabas = await auth.getWhatsAppBusinessAccounts(accessToken);
        if (!wabas || wabas.length === 0) return res.status(400).json({ error: 'No WhatsApp Business Accounts found' });

        return res.json({
            wabaOptions: wabas.map(w => ({ id: w.id, name: w.name, timezone_id: w.timezone_id }))
        });
    } catch (error: any) {
        console.error('getWhatsAppOptions error', error?.message);
        return res.status(500).json({ error: error?.message || 'Failed to fetch WhatsApp accounts' });
    }
}

export async function getPhoneNumberOptions(req: Request, res: Response)
{
    try {
        const { state, wabaId } = req.query as Record<string, string>;
        if (!state || !wabaId) return res.status(400).json({ error: 'Missing state or wabaId' });

        const stored = await oauthStateService.getState(state);
        if (!stored) return res.status(400).json({ error: 'Invalid or expired state' });

        const accessToken = stored.accessToken as string;
        if (!accessToken) return res.status(400).json({ error: 'No access token found' });

        const auth = new WhatsappAuthService();
        const phones = await auth.getPhoneNumbers(wabaId, accessToken);
        if (!phones || phones.length === 0) return res.status(400).json({ error: 'No phone numbers found for this account' });

        return res.json({
            phoneOptions: phones.map(p => ({
                id: p.id,
                displayPhoneNumber: p.display_phone_number,
                verifiedName: p.verified_name,
                qualityRating: p.quality_rating
            }))
        });
    } catch (error: any) {
        console.error('getPhoneNumberOptions error', error?.message);
        return res.status(500).json({ error: error?.message || 'Failed to fetch phone numbers' });
    }
}

export async function handleWhatsAppCallback(req: Request, res: Response)
{
    try {
        const { code, state } = req.query as Record<string, string>;

        if (!state || !code) return res.status(400).json({ error: 'Missing state or code' });

        const stored = await oauthStateService.getState(state);
        if (!stored) return res.status(400).json({ error: 'Invalid or expired state' });

        const age = Date.now() - new Date(stored.createdAt).getTime();
        if (age > 10 * 60 * 1000) {
            await oauthStateService.deleteState(state);
            return res.status(400).json({ error: 'State expired, reinitiate OAuth flow' });
        }

        const auth = new WhatsappAuthService();

        // Exchange code for short-lived token
        const shortLived = await auth.exchangeCodeForToken(code);

        // Exchange for long-lived token
        const longLived = await auth.getLongLivedToken(shortLived.access_token);

        // Store token in state for later retrieval by user
        await oauthStateService.updateState(state, { accessToken: longLived.access_token });

        // Return success with state (frontend will use this to fetch account options)
        return res.json({
            success: true,
            state: state,
            message: 'Authorization successful. Please select your WhatsApp Business Account and phone number.'
        });
    } catch (error: any) {
        console.error('handleWhatsAppCallback error', error?.message);
        return res.status(500).json({ error: error?.message || 'OAuth callback handling failed' });
    }
}

export async function saveWhatsAppConfig(req: Request, res: Response)
{
    try {
        const organizationId = req.params.id;
        const { state, wabaId, phoneNumberId } = req.body;

        if (!state || !wabaId || !phoneNumberId) {
            return res.status(400).json({ error: 'Missing required fields: state, wabaId, phoneNumberId' });
        }

        const stored = await oauthStateService.getState(state);
        if (!stored) return res.status(400).json({ error: 'Invalid or expired state' });

        const accessToken = stored.accessToken as string;
        if (!accessToken) return res.status(400).json({ error: 'No access token found' });

        // Verify organization exists
        const org = await orgService.getOrganizationById(organizationId);
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        // Save WhatsApp configuration with OAuth auth type
        const updated = await orgService.updateOrganization(organizationId, {
            whatsappToken: accessToken,
            whatsappBusinessId: wabaId,
            whatsappPhoneId: phoneNumberId,
            whatsappAuthType: 'oauth',
            whatsappConnectionStatus: 'connected'
        } as any);

        // Cleanup state
        await oauthStateService.deleteState(state);

        return res.json({
            success: true,
            data: updated,
            message: 'WhatsApp configuration saved successfully'
        });
    } catch (error: any) {
        console.error('saveWhatsAppConfig error', error?.message);
        return res.status(500).json({ error: error?.message || 'Failed to save WhatsApp configuration' });
    }
}

/**
 * Initialize WhatsApp connection using Baileys (QR code method)
 */
export async function initBaileysConnection(req: Request, res: Response)
{
    try {
        const organizationId = req.params.id;

        console.log(`[Controller] Initializing Baileys connection for org: ${organizationId}`);

        const org = await orgService.getOrganizationById(organizationId);
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        console.log(`[Controller] Organization found, creating Baileys client...`);

        // Check if there's an existing connected client
        const existingClient = baileysManager.getClient(organizationId);
        if (existingClient?.isReady) {
            return res.status(400).json({
                error: 'WhatsApp is already connected for this organization',
                message: 'Use the reconnect endpoint if you need to reconnect'
            });
        }

        // Create Baileys client (this will remove disconnected clients automatically)
        await orgService.connectWhatsApp(organizationId);

        // Update organization to use Baileys auth type
        await orgService.updateOrganizationWhatsAppStatus(organizationId, 'baileys', 'pending');

        console.log(`[Controller] Baileys client created, status updated to pending`);

        // Wait a bit for QR code to be generated
        await new Promise(resolve => setTimeout(resolve, 2000));

        const clientInfo = baileysManager.getClient(organizationId);
        if (!clientInfo?.qrCode) {
            console.log(`[Controller] QR code not yet available, will retry`);
            return res.status(202).json({
                message: 'Baileys connection initializing. QR code will be available shortly.',
                retryIn: 3000
            });
        }

        console.log(`[Controller] QR code generated successfully`);

        return res.json({
            success: true,
            message: 'Baileys connection initialized, scan the QR code',
            qrCode: clientInfo.qrCode
        });
    } catch (error: any) {
        console.error('[Controller] Error initializing Baileys connection:', error);
        return res.status(500).json({ error: error?.message || 'Failed to initialize Baileys connection' });
    }
}

/**
 * Get QR code for Baileys connection
 */
export async function getBaileysQRCode(req: Request, res: Response)
{
    try {
        const organizationId = req.params.id;
        const qrCode = await orgService.getQRCode(organizationId);

        return res.json({
            success: true,
            qrCode: qrCode,
            message: 'Scan this QR code with WhatsApp to connect'
        });
    } catch (error: any) {
        console.error('getBaileysQRCode error', error?.message);
        return res.status(500).json({ error: error?.message || 'Failed to get QR code' });
    }
}

/**
 * Disconnect WhatsApp (works for both OAuth and Baileys)
 */
export async function disconnectWhatsApp(req: Request, res: Response)
{
    try {
        const organizationId = req.params.id;
        const org = await orgService.getOrganizationById(organizationId);
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        // Disconnect Baileys client if it exists
        const clientInfo = baileysManager.getClient(organizationId);
        if (clientInfo) {
            await baileysManager.disconnectClient(organizationId);
        }

        // Update organization status
        await orgService.updateOrganization(organizationId, {
            whatsappConnectionStatus: 'disconnected'
        } as any);

        return res.json({
            success: true,
            message: 'WhatsApp disconnected successfully'
        });
    } catch (error: any) {
        console.error('disconnectWhatsApp error', error?.message);
        return res.status(500).json({ error: error?.message || 'Failed to disconnect WhatsApp' });
    }
}

/**
 * Reconnect WhatsApp for disconnected organization
 */
export async function reconnectBaileys(req: Request, res: Response)
{
    try {
        const organizationId = req.params.id;
        const org = await orgService.getOrganizationById(organizationId);
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        console.log(`[Controller] Reconnecting Baileys for org: ${organizationId}`);

        // Check if already connected
        const clientInfo = baileysManager.getClient(organizationId);
        if (clientInfo?.isReady) {
            return res.status(400).json({ error: 'WhatsApp is already connected' });
        }

        // Clean up any existing disconnected client
        if (clientInfo) {
            await baileysManager.removeClient(organizationId);
        }

        // Initialize new connection
        await orgService.connectWhatsApp(organizationId);
        await orgService.updateOrganizationWhatsAppStatus(organizationId, 'baileys', 'pending');

        // Wait for QR code generation
        await new Promise(resolve => setTimeout(resolve, 2000));

        const newClientInfo = baileysManager.getClient(organizationId);
        if (!newClientInfo?.qrCode) {
            return res.status(202).json({
                message: 'Reconnection initialized. QR code will be available shortly.',
                retryIn: 3000
            });
        }

        return res.json({
            success: true,
            message: 'Reconnection successful. Scan the QR code to reconnect.',
            qrCode: newClientInfo.qrCode
        });
    } catch (error: any) {
        console.error('[Controller] Reconnect error:', error);
        return res.status(500).json({ error: error?.message || 'Failed to reconnect' });
    }
}

/**
 * Check WhatsApp connection status
 */
export async function checkWhatsAppStatus(req: Request, res: Response)
{
    try {
        const organizationId = req.params.id;
        const org = await orgService.getOrganizationById(organizationId);
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        const isDisconnected = baileysManager.isClientDisconnected(organizationId);
        const clientInfo = baileysManager.getClient(organizationId);

        return res.json({
            success: true,
            authType: (org as any).whatsappAuthType || 'oauth',
            connectionStatus: (org as any).whatsappConnectionStatus || 'disconnected',
            isConnected: !isDisconnected,
            isDisconnected: isDisconnected,
            hasQRCode: !!clientInfo?.qrCode,
            canReconnect: isDisconnected
        });
    } catch (error: any) {
        console.error('checkWhatsAppStatus error', error?.message);
        return res.status(500).json({ error: error?.message || 'Failed to check WhatsApp status' });
    }
}

