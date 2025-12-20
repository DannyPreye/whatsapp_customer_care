import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface PasswordReset extends Document<string>
{
    _id: string; // reset token id
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    usedAt?: Date;
    createdAt: Date;
}

const PasswordResetSchema = new Schema<any>(
    {
        _id: { type: String, default: uuidv4 },
        userId: { type: String, required: true, ref: 'User' },
        tokenHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        usedAt: { type: Date },
        createdAt: { type: Date, default: Date.now }
    },
    { versionKey: false }
);

PasswordResetSchema.index({ userId: 1, expiresAt: 1 });

PasswordResetSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret: any) =>
    {
        ret.id = ret._id;
        delete ret._id;
        delete ret.tokenHash;
        return ret;
    }
});

export const PasswordResetModel = model<PasswordReset>('PasswordReset', PasswordResetSchema, 'password_resets');
