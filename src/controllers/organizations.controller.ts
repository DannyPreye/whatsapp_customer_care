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


export async function connectWhatsApp(req: Request, res: Response)
{
    try {
        const organizationId = req.params.id;

        const state = crypto.randomBytes(16).toString('hex');

        // Persist state in DB (expire after 10 minutes on read)
        await oauthStateService.createState(state, organizationId);

        const auth = new WhatsappAuthService();
        const url = auth.getAuthorizationUrl(state);

        // Return the URL to the client so they can be redirected
        return res.json({ url });

    } catch (error) {
        console.error('connectWhatsApp error', error);
        return res.status(500).json({ error: 'Failed to initiate WhatsApp connection' });
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
            return res.status(400).json({ error: 'State expired' });
        }

        const organizationId = stored.organizationId as string;

        const auth = new WhatsappAuthService();

        // exchange code -> short lived token
        const short = await auth.exchangeCodeForToken(code);

        // exchange for long lived token
        const long = await auth.getLongLivedToken(short.access_token);

        // fetch WABA accounts
        const wabas = await auth.getWhatsAppBusinessAccounts(long.access_token);
        if (!wabas || wabas.length === 0) return res.status(400).json({ error: 'No WhatsApp Business Account found' });

        const waba = wabas[ 0 ];

        // fetch phone numbers
        const phones = await auth.getPhoneNumbers(waba.id, long.access_token);
        if (!phones || phones.length === 0) return res.status(400).json({ error: 'No phone numbers found for WABA' });

        const phone = phones[ 0 ];

        // persist into organization
        await orgService.updateOrganization(organizationId, {
            whatsappToken: long.access_token,
            whatsappBusinessId: waba.id,
            whatsappPhoneId: phone.id
        } as any);

        // cleanup state
        await oauthStateService.deleteState(state);

        return res.json({ success: true });
    } catch (error: any) {
        console.error('handleWhatsAppCallback error', error?.message || error);
        return res.status(500).json({ error: error?.message || 'Callback handling failed' });
    }
}

