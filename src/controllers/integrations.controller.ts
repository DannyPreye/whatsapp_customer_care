import { Request, Response } from 'express';
import { IntegrationsService } from '../services/integrations.service';
import { ok, created, noContent } from '../utils/response';

const service = new IntegrationsService();

export async function listIntegrations(_req: Request, res: Response)
{
    const data = await service.list();
    return ok(res, data);
}

export async function createIntegration(req: Request, res: Response)
{
    const data = await service.create(req.body);
    return created(res, data);
}

export async function getIntegration(req: Request, res: Response)
{
    const data = await service.getById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    return ok(res, data);
}

export async function updateIntegration(req: Request, res: Response)
{
    const data = await service.update(req.params.id, req.body);
    if (!data) return res.status(404).json({ error: 'Not found' });
    return ok(res, data);
}

export async function deleteIntegration(req: Request, res: Response)
{
    const success = await service.remove(req.params.id);
    if (!success) return res.status(404).json({ error: 'Not found' });
    return noContent(res);
}

export async function testIntegration(req: Request, res: Response)
{
    const data = await service.test(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    return ok(res, data);
}
