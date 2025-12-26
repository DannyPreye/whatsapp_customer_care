import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { validate } from '../middlewares/validate';
import { authRequired } from '../middlewares/auth';
import { z } from 'zod';
import { UserRole } from '../models/user.model';

const router = Router();

const createUserSchema = z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    password: z.string().min(6),
    role: z.nativeEnum(UserRole).optional(),
    isActive: z.boolean().optional()
});

const updateUserSchema = z.object({
    email: z.string().email().optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    password: z.string().min(6).optional(),
    role: z.nativeEnum(UserRole).optional(),
    isActive: z.boolean().optional()
});

const updateRoleSchema = z.object({
    role: z.nativeEnum(UserRole)
});

router.get('/', usersController.list);
router.post('/', validate(createUserSchema), usersController.create);
router.get('/:id/dependencies', authRequired, usersController.getDependencies);
router.get('/:id', usersController.getById);
router.put('/:id', validate(updateUserSchema), usersController.update);
router.delete('/:id', usersController.remove);
router.put('/:id/role', validate(updateRoleSchema), usersController.updateRole);

export default router;
