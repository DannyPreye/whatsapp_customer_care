import { Request, Response } from 'express';
import * as orgService from '../services/organizations.service';
import { ok, created, noContent } from '../utils/response';
import crypto from 'crypto';
import { WhatsappAuthService } from '../services/whatsappAuth.service';
import * as oauthStateService from '../services/oauthState.service';

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

        // Save WhatsApp configuration
        const updated = await orgService.updateOrganization(organizationId, {
            whatsappToken: accessToken,
            whatsappBusinessId: wabaId,
            whatsappPhoneId: phoneNumberId
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

