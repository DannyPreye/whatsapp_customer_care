import { Request, Response } from 'express';
import { CustomersService } from '../services/customers.service';
import { getUserDependencies } from '../services/users.service';
import { ok, created, noContent } from '../utils/response';

const service = new CustomersService();

async function getOrgContext(req: Request): Promise<{ userId: string; accessibleOrgIds: Set<string>; ownedOrgIds: Set<string>; }>
{
    const user = (req as any).user as { sub: string; } | undefined;
    if (!user || !user.sub) throw new Error('Unauthorized');
    const userId = user.sub;
    const deps = await getUserDependencies(userId);
    const accessibleOrgIds = new Set<string>();
    const ownedOrgIds = new Set<string>();
    if (deps?.organizations) {
        for (const o of deps.organizations) {
            accessibleOrgIds.add(o.organization._id);
            if (o.relation === 'OWNER') ownedOrgIds.add(o.organization._id);
        }
    }
    return { userId, accessibleOrgIds, ownedOrgIds };
}

export async function listCustomers(req: Request, res: Response)
{
    try {
        const { accessibleOrgIds } = await getOrgContext(req);
        const orgId = (req.query.organizationId as string) || undefined;
        if (orgId) {
            if (!accessibleOrgIds.has(orgId)) return res.status(403).json({ error: 'Forbidden' });
            const data = await service.listByOrganizations([ orgId ]);
            return ok(res, data);
        }
        const data = await service.listByOrganizations(Array.from(accessibleOrgIds));
        return ok(res, data);
    } catch (e) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

export async function createCustomer(req: Request, res: Response)
{
    try {
        const { ownedOrgIds } = await getOrgContext(req);
        const orgId = req.body?.organizationId as string | undefined;
        if (!orgId) return res.status(400).json({ error: 'organizationId is required' });
        if (!ownedOrgIds.has(orgId)) return res.status(403).json({ error: 'Only organization owner can create customers' });
        const data = await service.create(req.body);
        return created(res, data);
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

export async function getCustomer(req: Request, res: Response)
{
    try {
        const { accessibleOrgIds } = await getOrgContext(req);
        const data = await service.getById(req.params.id);
        if (!data) return res.status(404).json({ error: 'Not found' });
        if (!accessibleOrgIds.has(data.organizationId)) return res.status(403).json({ error: 'Forbidden' });
        return ok(res, data);
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

export async function updateCustomer(req: Request, res: Response)
{
    try {
        const { ownedOrgIds } = await getOrgContext(req);
        const existing = await service.getById(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Not found' });
        if (!ownedOrgIds.has(existing.organizationId)) return res.status(403).json({ error: 'Only organization owner can update customers' });
        const data = await service.update(req.params.id, req.body);
        return ok(res, data!);
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

export async function deleteCustomer(req: Request, res: Response)
{
    try {
        const { ownedOrgIds } = await getOrgContext(req);
        const existing = await service.getById(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Not found' });
        if (!ownedOrgIds.has(existing.organizationId)) return res.status(403).json({ error: 'Only organization owner can delete customers' });
        const success = await service.remove(req.params.id);
        if (!success) return res.status(404).json({ error: 'Not found' });
        return noContent(res);
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

export async function getCustomerConversations(req: Request, res: Response)
{
    try {
        const { accessibleOrgIds } = await getOrgContext(req);
        const existing = await service.getById(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Not found' });
        if (!accessibleOrgIds.has(existing.organizationId)) return res.status(403).json({ error: 'Forbidden' });
        const { page, limit, status, priority, assignedToId, startDate, endDate, sortBy, order } = req.query as any;
        const data = await service.listConversations(req.params.id, {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            status,
            priority,
            assignedToId,
            startDate,
            endDate,
            sortBy,
            order
        });
        return ok(res, data);
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

export async function blockCustomer(req: Request, res: Response)
{
    try {
        const { ownedOrgIds } = await getOrgContext(req);
        const existing = await service.getById(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Not found' });
        if (!ownedOrgIds.has(existing.organizationId)) return res.status(403).json({ error: 'Only organization owner can block customers' });
        const data = await service.block(req.params.id);
        return ok(res, data!);
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

export async function unblockCustomer(req: Request, res: Response)
{
    try {
        const { ownedOrgIds } = await getOrgContext(req);
        const existing = await service.getById(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Not found' });
        if (!ownedOrgIds.has(existing.organizationId)) return res.status(403).json({ error: 'Only organization owner can unblock customers' });
        const data = await service.unblock(req.params.id);
        return ok(res, data!);
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}
