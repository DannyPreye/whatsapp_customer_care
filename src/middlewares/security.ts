import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { v4 as uuid } from 'uuid';
import { config } from '../config';
import { Request, Response, NextFunction } from 'express';

export function applySecurity(app: import('express').Express): void
{
    app.use(helmet());
    app.use(cookieParser());
    app.use(
        cors({
            origin: config.env.CORS_ORIGIN,
            credentials: true
        })
    );
    app.use(compression());
    app.use(sanitizeInputs);
    app.use(
        rateLimit({
            windowMs: 60 * 1000,
            max: 200
        })
    );
    app.use(requestId);
}

function requestId(req: Request, res: Response, next: NextFunction): void
{
    const id = (req.headers[ 'x-request-id' ] as string) || uuid();
    res.setHeader('x-request-id', id);
    (req as any).requestId = id;
    next();
}

function sanitizeInputs(req: Request, _res: Response, next: NextFunction): void
{
    const sanitize = (value: any): any =>
    {
        if (typeof value === 'string') {
            // Basic XSS sanitization: strip script tags and encode angle brackets
            let v = value.replace(/<\s*script[^>]*>([\s\S]*?)<\s*\/\s*script\s*>/gi, '');
            v = v.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return v;
        }
        if (Array.isArray(value)) return value.map(sanitize);
        if (value && typeof value === 'object') {
            const out: Record<string, any> = {};
            for (const [ k, v ] of Object.entries(value)) out[ k ] = sanitize(v);
            return out;
        }
        return value;
    };
    if (req.body) (req as any).body = sanitize(req.body);
    if (req.params) (req as any).params = sanitize(req.params);
    // Do NOT mutate req.query to avoid getter-only errors in Express Router
    next();
}
