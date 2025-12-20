import { Router } from 'express';
import { verifyWhatsApp, receiveWhatsApp } from '../controllers/webhook.controller';

const router = Router();

// WhatsApp Business API webhook
router.get('/webhook/whatsapp', verifyWhatsApp);
router.post('/webhook/whatsapp', receiveWhatsApp);

export default router;
