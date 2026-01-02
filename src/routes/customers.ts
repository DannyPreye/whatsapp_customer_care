import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { authRequired } from '../middlewares/auth';
import
{
    listCustomers,
    createCustomer,
    bulkCreateCustomers,
    outreachNewCustomers,
    getCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerConversations,
    blockCustomer,
    unblockCustomer
} from '../controllers/customers.controller';

const router = Router();

const createSchema = z.object({
    organizationId: z.string(),
    whatsappNumber: z.string(),
    name: z.string().optional(),
    email: z.string().email().optional(),
    language: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    tags: z.array(z.string()).optional(),
    hasStartedConversation: z.boolean().optional()
});

const bulkCreateSchema = z.object({
    customers: z.array(createSchema.extend({
        hasStartedConversation: z.boolean().optional()
    })).min(1)
});

const outreachSchema = z.object({
    organizationId: z.string(),
    message: z.string().min(1).max(4096).optional()
});

const updateSchema = createSchema.partial();

const listConversationsQuery = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    assignedToId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    sortBy: z.enum([ 'lastMessageAt', 'startedAt', 'endedAt' ]).optional(),
    order: z.enum([ 'asc', 'desc' ]).optional()
});

router.get('/customers', authRequired, listCustomers);
router.post('/customers', authRequired, validate(createSchema), createCustomer);
router.post('/customers/bulk', authRequired, validate(bulkCreateSchema), bulkCreateCustomers);
router.post('/customers/outreach', authRequired, validate(outreachSchema), outreachNewCustomers);
router.get('/customers/:id', authRequired, getCustomer);
router.put('/customers/:id', authRequired, validate(updateSchema), updateCustomer);
router.delete('/customers/:id', authRequired, deleteCustomer);
router.get('/customers/:id/conversations', authRequired, getCustomerConversations);
router.put('/customers/:id/block', authRequired, blockCustomer);
router.put('/customers/:id/unblock', authRequired, unblockCustomer);

export default router;
