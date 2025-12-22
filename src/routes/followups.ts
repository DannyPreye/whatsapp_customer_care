import { Router } from 'express';
import { validate } from '../middlewares/validate';
import * as controller from '../controllers/followups.controller';
import { z } from 'zod';

const router = Router();

const pendingQuery = z.object({
    organizationId: z.string().optional(),
    limit: z.string().regex(/^\d+$/).optional()
});

const sentQuery = z.object({
    organizationId: z.string().optional(),
    days: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional()
});

router.get('/followups/pending', validate(pendingQuery, 'query'), controller.listPending);
router.get('/followups/sent', validate(sentQuery, 'query'), controller.listSent);

export default router;
