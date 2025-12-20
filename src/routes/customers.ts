import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middlewares/validate';
import { authRequired } from '../middlewares/auth';
import
    {
        listCustomers,
        createCustomer,
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
    tags: z.array(z.string()).optional()
});

const updateSchema = createSchema.partial();

router.get('/customers', authRequired, listCustomers);
router.post('/customers', authRequired, validate(createSchema), createCustomer);
router.get('/customers/:id', authRequired, getCustomer);
router.put('/customers/:id', authRequired, validate(updateSchema), updateCustomer);
router.delete('/customers/:id', authRequired, deleteCustomer);
router.get('/customers/:id/conversations', authRequired, getCustomerConversations);
router.put('/customers/:id/block', authRequired, blockCustomer);
router.put('/customers/:id/unblock', authRequired, unblockCustomer);

export default router;
