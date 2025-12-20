import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { authRequired } from '../middlewares/auth';
import
    {
        listIntegrations,
        createIntegration,
        getIntegration,
        updateIntegration,
        deleteIntegration,
        testIntegration
    } from '../controllers/integrations.controller';

const router = Router();

const createSchema = z.object({
    organizationId: z.string(),
    type: z.string(),
    name: z.string(),
    config: z.record(z.string(), z.any()).optional(),
    isActive: z.boolean().optional()
});

const updateSchema = createSchema.partial();

router.get('/integrations', authRequired, listIntegrations);
router.post('/integrations', authRequired, validate(createSchema), createIntegration);
router.get('/integrations/:id', authRequired, getIntegration);
router.put('/integrations/:id', authRequired, validate(updateSchema), updateIntegration);
router.delete('/integrations/:id', authRequired, deleteIntegration);
router.post('/integrations/:id/test', authRequired, testIntegration);

export default router;
