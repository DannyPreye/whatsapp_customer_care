import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { authRequired } from '../middlewares/auth';
import { getConversationMessages } from '../controllers/conversations.controller';

const router = Router();

const listMessagesQuery = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    q: z.string().optional(),
    direction: z.enum([ 'INBOUND', 'OUTBOUND' ]).optional(),
    type: z.enum([ 'TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO', 'LOCATION', 'TEMPLATE' ]).optional(),
    status: z.enum([ 'PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED' ]).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    sortBy: z.enum([ 'createdAt', 'deliveredAt', 'readAt' ]).optional(),
    order: z.enum([ 'asc', 'desc' ]).optional()
});

router.get('/conversations/:id/messages', authRequired, getConversationMessages);

export default router;
