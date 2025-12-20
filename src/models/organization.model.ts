import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface Organization extends Document<string>
{
    _id: string;
    name: string;
    description?: string;
    industry?: string;
    website?: string;
    whatsappPhoneId?: string;
    whatsappToken?: string;
    whatsappBusinessId?: string;
    isActive: boolean;
    settings: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const OrganizationSchema = new Schema<any>(
    {
        _id: { type: String, default: uuidv4 },
        name: { type: String, required: true },
        description: { type: String },
        industry: { type: String },
        website: { type: String },
        whatsappPhoneId: { type: String },
        whatsappToken: { type: String },
        whatsappBusinessId: { type: String },
        isActive: { type: Boolean, default: true },
        settings: { type: Schema.Types.Mixed, default: {} }
    },
    { timestamps: true }
);

OrganizationSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: any) =>
    {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
});

export const OrganizationModel = model<Organization>('Organization', OrganizationSchema, 'organizations');
