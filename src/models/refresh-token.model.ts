import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface RefreshToken extends Document<string>
{
    _id: string; // token id
    userId: string;
    tokenHash: string;
    expiredAt: Date;
    revokedAt?: Date;
    userAgent?: string;
    ip?: string;
    createdAt: Date;
}

const RefreshTokenSchema = new Schema<any>(
    {
        _id: { type: String, default: uuidv4 },
        userId: { type: String, required: true, ref: 'User' },
        tokenHash: { type: String, required: true },
        expiredAt: { type: Date, required: true },
        revokedAt: { type: Date },
        userAgent: { type: String },
        ip: { type: String },
        createdAt: { type: Date, default: Date.now }
    },
    { versionKey: false }
);

RefreshTokenSchema.index({ userId: 1, revokedAt: 1 });

RefreshTokenSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret: any) =>
    {
        ret.id = ret._id;
        delete ret._id;
        delete ret.tokenHash;
        return ret;
    }
});

export const RefreshTokenModel = model<RefreshToken>('RefreshToken', RefreshTokenSchema, 'refresh_tokens');
