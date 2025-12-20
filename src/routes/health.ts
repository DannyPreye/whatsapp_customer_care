import { Router } from 'express';
import { mongoReady } from '../db/mongo';
import { ok } from '../utils/response';

const router = Router();

router.get('/live', (_req, res) =>
{
    ok(res, { status: 'ok' });
});

router.get('/ready', (_req, res) =>
{
    ok(res, { status: mongoReady() ? 'ready' : 'not-ready' });
});

export default router;
