import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface Customer extends Document<string>
{
    _id: string;
    organizationId: string;
    whatsappNumber: string;
    name?: string;
    email?: string;
    language: string;
    metadata: Record<string, unknown>;
    tags: string[];
    isBlocked: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastSeenAt?: Date;
}

const CustomerSchema = new Schema<any>(
    {
        _id: { type: String, default: uuidv4 },
        organizationId: { type: String, required: true, ref: 'Organization' },
        whatsappNumber: { type: String, required: true },
        name: { type: String },
        email: { type: String },
        language: { type: String, default: 'en' },
        metadata: { type: Schema.Types.Mixed, default: {} },
        tags: { type: [ String ], default: [] },
        isBlocked: { type: Boolean, default: false }
    },
    { timestamps: true }
);

CustomerSchema.index({ organizationId: 1, whatsappNumber: 1 }, { unique: true });
CustomerSchema.index({ whatsappNumber: 1 });

CustomerSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: any) =>
    {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
});

export const CustomerModel = model<Customer>('Customer', CustomerSchema, 'customers');
