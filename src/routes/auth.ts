import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1)
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

const refreshSchema = z.object({
    refreshToken: z.string().min(10)
});

const forgotSchema = z.object({
    email: z.string().email()
});

const resetSchema = z.object({
    token: z.string().min(10),
    password: z.string().min(6)
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(refreshSchema), authController.logout);
router.post('/forgot-password', validate(forgotSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetSchema), authController.resetPassword);

export default router;
