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
    isActive: z.boolean().optional()
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

// WhatsApp OAuth flow
router.get('/:id/whatsapp/init-oauth', orgController.initWhatsAppOAuth);
router.get('/whatsapp/callback', orgController.handleWhatsAppCallback);
router.get('/whatsapp/accounts', orgController.getWhatsAppOptions);
router.get('/whatsapp/phone-numbers', orgController.getPhoneNumberOptions);
router.post('/:id/whatsapp/save-config', orgController.saveWhatsAppConfig);

// WhatsApp Baileys flow
router.post('/:id/whatsapp/init-baileys', orgController.initBaileysConnection);
router.get('/:id/whatsapp/qrcode', orgController.getBaileysQRCode);
router.post('/:id/whatsapp/reconnect', orgController.reconnectBaileys);

// WhatsApp general endpoints
router.delete('/:id/whatsapp/disconnect', orgController.disconnectWhatsApp);
router.get('/:id/whatsapp/status', orgController.checkWhatsAppStatus);

// Organization settings
router.get('/:id/settings', orgController.getSettings);
router.put('/:id/settings', validate(z.record(z.string(), z.any())), orgController.updateSettings);
router.get('/:id/agent-settings', orgController.getAgentSettings);
router.put('/:id/agent-settings', validate(agentSettingsSchema), orgController.updateAgentSettings);

export default router;
