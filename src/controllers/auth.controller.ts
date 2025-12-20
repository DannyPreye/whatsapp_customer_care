import { Request, Response } from 'express';
import { ok, created } from '../utils/response';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response)
{
    const { email, password, firstName, lastName } = req.body as {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    };
    const user = await authService.registerUser({ email, password, firstName, lastName });
    const tokens = await authService.issueTokens(user, req.headers[ 'user-agent' ], req.ip);
    created(res, { user, tokens });
}

export async function login(req: Request, res: Response)
{
    const { email, password } = req.body as { email: string; password: string; };
    const user = await authService.authenticate(email, password);
    const tokens = await authService.issueTokens(user, req.headers[ 'user-agent' ], req.ip);
    ok(res, { user, tokens });
}

export async function refresh(req: Request, res: Response)
{
    const { refreshToken } = req.body as { refreshToken: string; };
    const tokens = await authService.refreshTokens(refreshToken, req.headers[ 'user-agent' ], req.ip);
    ok(res, tokens);
}

export async function logout(req: Request, res: Response)
{
    const { refreshToken } = req.body as { refreshToken: string; };
    await authService.revokeRefreshToken(refreshToken);
    ok(res, { success: true });
}

export async function forgotPassword(req: Request, res: Response)
{
    const { email } = req.body as { email: string; };
    const { resetToken } = await authService.requestPasswordReset(email);
    ok(res, { resetToken });
}

export async function resetPassword(req: Request, res: Response)
{
    const { token, password } = req.body as { token: string; password: string; };
    await authService.resetPassword(token, password);
    ok(res, { success: true });
}
