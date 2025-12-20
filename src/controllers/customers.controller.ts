import { Request, Response } from 'express';
import { CustomersService } from '../services/customers.service';
import { ok, created, noContent } from '../utils/response';

const service = new CustomersService();

export async function listCustomers(_req: Request, res: Response)
{
    const data = await service.list();
    return ok(res, data);
}

export async function createCustomer(req: Request, res: Response)
{
    const data = await service.create(req.body);
    return created(res, data);
}

export async function getCustomer(req: Request, res: Response)
{
    const data = await service.getById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    return ok(res, data);
}

export async function updateCustomer(req: Request, res: Response)
{
    const data = await service.update(req.params.id, req.body);
    if (!data) return res.status(404).json({ error: 'Not found' });
    return ok(res, data);
}

export async function deleteCustomer(req: Request, res: Response)
{
    const success = await service.remove(req.params.id);
    if (!success) return res.status(404).json({ error: 'Not found' });
    return noContent(res);
}

export async function getCustomerConversations(req: Request, res: Response)
{
    const data = await service.listConversations(req.params.id);
    return ok(res, data);
}

export async function blockCustomer(req: Request, res: Response)
{
    const data = await service.block(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    return ok(res, data);
}

export async function unblockCustomer(req: Request, res: Response)
{
    const data = await service.unblock(req.params.id);
    if (!data) return res.status(404).json({ error: 'Not found' });
    return ok(res, data);
}
