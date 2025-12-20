import { Router } from 'express';
import * as orgController from '../controllers/organizations.controller';
import { validate } from '../middlewares/validate';
import { z } from 'zod';

const router = Router();

const baseSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    industry: z.string().optional(),
    website: z.string().url().optional(),
    whatsappPhoneId: z.string().optional(),
    whatsappToken: z.string().optional(),
    whatsappBusinessId: z.string().optional(),
    isActive: z.boolean().optional(),
    settings: z.record(z.string(), z.any()).optional()
});

const updateSchema = baseSchema.partial();

router.get('/', orgController.list);
router.post('/', validate(baseSchema), orgController.create);
router.get('/:id', orgController.getById);
router.put('/:id', validate(updateSchema), orgController.update);
router.delete('/:id', orgController.remove);
router.get('/:id/settings', orgController.getSettings);
router.put('/:id/settings', validate(z.record(z.string(), z.any())), orgController.updateSettings);

export default router;
