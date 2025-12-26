import { Router } from 'express';
import * as orgController from '../controllers/organizations.controller';
import { validate } from '../middlewares/validate';
import { authRequired } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();
router.use(authRequired);

const baseSchema = z.object({
    name: z.string().min(1),
    ownerId: z.string().min(1),
    description: z.string().optional(),
    industry: z.string().optional(),
    website: z.string().url().optional(),
    whatsappPhoneId: z.string().optional(),
    whatsappToken: z.string().optional(),
    whatsappBusinessId: z.string().optional(),
    isActive: z.boolean().optional(),
    settings: z.record(z.string(), z.any()).optional()
});

const agentSettingsSchema = z.object({
    systemPrompt: z.string().max(4000).optional(),
    tone: z.enum([ 'concise', 'friendly', 'formal', 'playful' ]).optional(),
    maxReplyLength: z.number().min(20).max(400).optional(),
    signature: z.string().max(500).optional(),
    callToAction: z.string().max(500).optional(),
    followUpEnabled: z.boolean().optional(),
    escalation: z.object({
        enabled: z.boolean(),
        rules: z.array(z.string().max(300)).max(20).optional(),
        phone: z.string().max(30).optional()
    }).optional()
});

const updateSchema = baseSchema.partial();

router.get('/', orgController.list);
router.post('/', validate(baseSchema), orgController.create);
router.get('/:id', orgController.getById);
router.put('/:id', validate(updateSchema), orgController.update);
router.delete('/:id', orgController.remove);
router.get('/:id/connect-whatsapp', orgController.connectWhatsApp);
router.get('/oauth/meta/callback', orgController.handleWhatsAppCallback);
router.get('/:id/settings', orgController.getSettings);
router.put('/:id/settings', validate(z.record(z.string(), z.any())), orgController.updateSettings);
router.get('/:id/agent-settings', orgController.getAgentSettings);
router.put('/:id/agent-settings', validate(agentSettingsSchema), orgController.updateAgentSettings);

export default router;
