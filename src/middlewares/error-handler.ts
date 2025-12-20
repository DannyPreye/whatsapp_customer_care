import { Request, Response, NextFunction } from 'express';
import createError, { HttpError } from 'http-errors';
import { logger } from '../logger';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void
{
    next(createError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void
{
    const error = (err as HttpError) || createError(500);
    const status = error.status || 500;
    const payload = {
        status,
        error: error.message || 'Internal Server Error'
    };
    logger.error('Request failed', {
        status,
        path: req.originalUrl,
        method: req.method,
        requestId: (req as any).requestId,
        stack: (error as any).stack
    });
    res.status(status).json(payload);
}
