import { Router } from 'express';
import { authRequired } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { z } from 'zod';
import
{
    analyticsOverview,
    analyticsConversations,
    analyticsPerformance,
    analyticsCSAT,
    analyticsAgentPerformance,
    analyticsExport
} from '../controllers/analytics.controller';

const router = Router();

const analyticsQuerySchema = z.object({
    organizationId: z.string().min(1),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
});

router.get('/analytics/overview', authRequired, validate(analyticsQuerySchema, 'query'), analyticsOverview);
router.get('/analytics/conversations', authRequired, validate(analyticsQuerySchema, 'query'), analyticsConversations);
router.get('/analytics/performance', authRequired, validate(analyticsQuerySchema, 'query'), analyticsPerformance);
router.get('/analytics/customer-satisfaction', authRequired, validate(analyticsQuerySchema, 'query'), analyticsCSAT);
router.get('/analytics/agent-performance', authRequired, validate(analyticsQuerySchema, 'query'), analyticsAgentPerformance);
router.get('/analytics/export', authRequired, validate(analyticsQuerySchema, 'query'), analyticsExport);

export default router;
