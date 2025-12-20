import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export enum UserRole
{
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    AGENT = 'AGENT',
    VIEWER = 'VIEWER'
}

export interface User extends Document<string>
{
    _id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<any>(
    {
        _id: { type: String, default: uuidv4 },
        email: { type: String, unique: true, required: true, index: true },
        password: { type: String, required: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        role: { type: String, enum: Object.values(UserRole), default: UserRole.ADMIN },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

UserSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: any) =>
    {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password; // never expose password
        return ret;
    }
});

export const UserModel = model<User>('User', UserSchema, 'users');
