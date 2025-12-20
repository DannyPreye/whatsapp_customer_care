import jwt, { Secret } from 'jsonwebtoken';
import crypto from 'crypto';
import dayjs from 'dayjs';
import { config } from '../config';
import { UserModel, User } from '../models/user.model';
import { RefreshTokenModel } from '../models/refresh-token.model';
import { PasswordResetModel } from '../models/password-reset.model';
import { hashPassword, comparePassword } from '../utils/password';

export type Tokens = { accessToken: string; refreshToken: string; };

function signAccessToken(payload: object): string
{
    return jwt.sign(payload, config.env.JWT_SECRET as Secret, { expiresIn: config.env.ACCESS_TOKEN_TTL as any });
}

function signRefreshToken(payload: object): string
{
    return jwt.sign(payload, config.env.JWT_REFRESH_SECRET as Secret, { expiresIn: config.env.REFRESH_TOKEN_TTL as any });
}

function expiryFromTTL(ttl: string): Date
{
    const match = /^([0-9]+)([smhd])$/.exec(ttl);
    if (!match) return dayjs().add(7, 'day').toDate();
    const value = parseInt(match[ 1 ], 10);
    const unit = match[ 2 ];
    if (unit === 's') return dayjs().add(value, 'second').toDate();
    if (unit === 'm') return dayjs().add(value, 'minute').toDate();
    if (unit === 'h') return dayjs().add(value, 'hour').toDate();
    return dayjs().add(value, 'day').toDate();
}

export async function registerUser(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}): Promise<User>
{
    const exists = await UserModel.findOne({ email: input.email }).lean();
    if (exists) throw new Error('Email already registered');
    const hashed = await hashPassword(input.password);
    const user = new UserModel({
        email: input.email,
        password: hashed,
        firstName: input.firstName,
        lastName: input.lastName
    });
    return user.save();
}

export async function authenticate(email: string, password: string): Promise<User>
{
    const user = await UserModel.findOne({ email }).exec();
    if (!user) throw new Error('Invalid credentials');
    const ok = await comparePassword(password, user.password);
    if (!ok) throw new Error('Invalid credentials');
    return user;
}

export async function issueTokens(user: User, userAgent?: string, ip?: string): Promise<Tokens>
{
    const payload = { sub: user._id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ ...payload, type: 'refresh' });
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiredAt = expiryFromTTL(config.env.REFRESH_TOKEN_TTL);
    await new RefreshTokenModel({ userId: user._id, tokenHash, expiredAt, userAgent, ip }).save();
    return { accessToken, refreshToken };
}

export async function refreshTokens(refreshToken: string, userAgent?: string, ip?: string): Promise<Tokens>
{
    jwt.verify(refreshToken, config.env.JWT_REFRESH_SECRET as Secret);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const tokenDoc = await RefreshTokenModel.findOne({ tokenHash, revokedAt: { $exists: false } }).exec();
    if (!tokenDoc || dayjs(tokenDoc.expiredAt).isBefore(dayjs())) throw new Error('Invalid refresh token');
    const user = await UserModel.findById(tokenDoc.userId).exec();
    if (!user) throw new Error('Invalid refresh token');
    return issueTokens(user, userAgent, ip);
}

export async function revokeRefreshToken(refreshToken: string): Promise<void>
{
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await RefreshTokenModel.updateMany({ tokenHash, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
}

export async function requestPasswordReset(email: string): Promise<{ resetToken: string; }>
{
    const user = await UserModel.findOne({ email }).exec();
    if (!user) return { resetToken: '' }; // avoid user enumeration
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = dayjs().add(1, 'hour').toDate();
    await new PasswordResetModel({ userId: user._id, tokenHash, expiresAt }).save();
    // In production, send email/SMS; here we return token for testing
    return { resetToken };
}

export async function resetPassword(resetToken: string, newPassword: string): Promise<void>
{
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const record = await PasswordResetModel.findOne({ tokenHash }).exec();
    if (!record || record.usedAt || dayjs(record.expiresAt).isBefore(dayjs())) throw new Error('Invalid or expired token');
    const user = await UserModel.findById(record.userId).exec();
    if (!user) throw new Error('Invalid user');
    user.password = await hashPassword(newPassword);
    await user.save();
    record.usedAt = new Date();
    await record.save();
}
