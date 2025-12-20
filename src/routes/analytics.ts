import { Router } from 'express';
import { authRequired } from '../middlewares/auth';
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

router.get('/analytics/overview', authRequired, analyticsOverview);
router.get('/analytics/conversations', authRequired, analyticsConversations);
router.get('/analytics/performance', authRequired, analyticsPerformance);
router.get('/analytics/customer-satisfaction', authRequired, analyticsCSAT);
router.get('/analytics/agent-performance', authRequired, analyticsAgentPerformance);
router.get('/analytics/export', authRequired, analyticsExport);

export default router;
