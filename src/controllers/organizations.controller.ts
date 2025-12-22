import { Request, Response } from 'express';
import * as orgService from '../services/organizations.service';
import { ok, created, noContent } from '../utils/response';

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
