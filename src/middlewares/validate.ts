import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema | undefined, source: 'body' | 'query' | 'params' = 'body')
{
    return (req: Request, res: Response, next: NextFunction) =>
    {
        if (!schema) return next();
        try {
            const data = req[ source as keyof typeof req ];
            const result = schema.parse(data);

            console.log('Validation successful:', result);
            (req as any)[ source ] = result;
            next();
        } catch (e: any) {
            console.error(`Validation error on ${source}:`, e.errors);
            res.status(400).json({ error: 'Validation failed', details: e.errors });
        }
    };
}
