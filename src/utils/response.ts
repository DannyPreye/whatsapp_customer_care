import { Response } from 'express';

export function ok(res: Response, data: unknown): void
{
    res.status(200).json({ data });
}

export function created(res: Response, data: unknown): void
{
    res.status(201).json({ data });
}

export function noContent(res: Response): void
{
    res.status(204).send();
}
