import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body')
{
    return (req: Request, res: Response, next: NextFunction) =>
    {
        try {
            const result = schema.parse(req[ source ]);
            (req as any)[ source ] = result;
            next();
        } catch (e: any) {
            res.status(400).json({ error: 'Validation failed', details: e.errors });
        }
    };
}
