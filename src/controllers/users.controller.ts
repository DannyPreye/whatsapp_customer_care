import { Request, Response } from 'express';
import * as usersService from '../services/users.service';
import { hashPassword } from '../utils/password';
import { ok, created } from '../utils/response';
import { UserRole } from '../models/user.model';

export async function list(_req: Request, res: Response)
{
    const users = await usersService.listUsers();
    ok(res, users);
}

export async function create(req: Request, res: Response)
{
    const { email, firstName, lastName, password } = req.body as {
        email: string;
        firstName: string;
        lastName: string;
        password: string;
    };
    const hashed = await hashPassword(password);
    const user = await usersService.createUser(email, firstName, lastName, hashed);
    created(res, user);
}

export async function getById(req: Request, res: Response)
{
    const { id } = req.params as { id: string; };
    const user = await usersService.getUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    ok(res, user);
}

export async function update(req: Request, res: Response)
{
    const { id } = req.params as { id: string; };
    const user = await usersService.updateUser(id, req.body);
    if (!user) return res.status(404).json({ error: 'User not found' });
    ok(res, user);
}

export async function remove(req: Request, res: Response)
{
    const { id } = req.params as { id: string; };
    const deleted = await usersService.deleteUser(id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.status(204).send();
}

export async function updateRole(req: Request, res: Response)
{
    const { id } = req.params as { id: string; };
    const { role } = req.body as { role: UserRole; };
    const user = await usersService.setUserRole(id, role);
    if (!user) return res.status(404).json({ error: 'User not found' });
    ok(res, user);
}
