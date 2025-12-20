import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthPayload
{
    sub: string;
    email?: string;
    roles?: string[];
}

export function authOptional(req: Request, _res: Response, next: NextFunction): void
{
    const token = getToken(req);
    if (!token) return next();
    try {
        const payload = jwt.verify(token, config.env.JWT_SECRET) as AuthPayload;
        (req as any).user = payload;
    } catch { }
    next();
}

export function authRequired(req: Request, res: Response, next: NextFunction): void
{
    const token = getToken(req);
    if (!token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const payload = jwt.verify(token, config.env.JWT_SECRET) as AuthPayload;
        (req as any).user = payload;
        next();
    } catch {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

function getToken(req: Request): string | null
{
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) return auth.substring(7);
    const cookie = (req as any).cookies?.token;
    return cookie || null;
}
