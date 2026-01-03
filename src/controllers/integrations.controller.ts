import { Request, Response } from 'express';
import { IntegrationsService } from '../services/integrations.service';
import { ok, created, noContent } from '../utils/response';

const service = new IntegrationsService();

export async function listIntegrations(req: Request, res: Response)
{
    try {
        const { organizationId, type } = req.query;

        let data;
        if (organizationId) {
            data = await service.listByOrganization(
                organizationId as string,
                type as string | undefined
            );
        } else {
            data = await service.list();
        }

        return ok(res, data);
    } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
    }
}

export async function createIntegration(req: Request, res: Response)
{
    try {
        const { organizationId, type, name, config } = req.body;

        if (!organizationId || !type || !name) {
            return res.status(400).json({
                error: 'organizationId, type, and name are required'
            });
        }

        const data = await service.create({
            organizationId,
            type,
            name,
            config
        });
        return created(res, data);
    } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
    }
}

export async function getIntegration(req: Request, res: Response)
{
    try {
        const data = await service.getById(req.params.id);
        if (!data) return res.status(404).json({ error: 'Not found' });
        return ok(res, data);
    } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
    }
}

export async function updateIntegration(req: Request, res: Response)
{
    try {
        const data = await service.update(req.params.id, req.body);
        if (!data) return res.status(404).json({ error: 'Not found' });
        return ok(res, data);
    } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
    }
}

export async function deleteIntegration(req: Request, res: Response)
{
    try {
        const success = await service.remove(req.params.id);
        if (!success) return res.status(404).json({ error: 'Not found' });
        return noContent(res);
    } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
    }
}

export async function testIntegration(req: Request, res: Response)
{
    try {
        const data = await service.test(req.params.id);
        if (!data) return res.status(404).json({ error: 'Not found' });
        return ok(res, data);
    } catch (error) {
        return res.status(500).json({ error: (error as Error).message });
    }
}
