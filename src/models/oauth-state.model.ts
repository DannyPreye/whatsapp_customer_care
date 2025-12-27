import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface OAuthState extends Document<string>
{
    _id: string;
    state: string;
    organizationId: string;
    accessToken?: string;
    createdAt: Date;
}

const OAuthStateSchema = new Schema<any>(
    {
        _id: { type: String, default: uuidv4 },
        state: { type: String, required: true, unique: true },
        organizationId: { type: String, required: true },
        accessToken: { type: String, select: false }
    },
    { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

OAuthStateSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: any) =>
    {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
});

export const OAuthStateModel = model<OAuthState>('OAuthState', OAuthStateSchema, 'oauth_states');
