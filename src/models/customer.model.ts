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
    hasStartedConversation: boolean;
    lifecycleStage?: 'unknown' | 'lead' | 'prospect' | 'customer' | 'churnRisk';
    prospectScore?: number;
    nextFollowUpAt?: Date;
    followUpNotes?: string;
    lastFollowUpSentAt?: Date;
    followUpSentCount?: number;
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
        isBlocked: { type: Boolean, default: false },
        hasStartedConversation: { type: Boolean, default: false },
        lifecycleStage: { type: String, enum: [ 'unknown', 'lead', 'prospect', 'customer', 'churnRisk' ], default: 'unknown' },
        prospectScore: { type: Number, min: 0, max: 1, default: 0 },
        nextFollowUpAt: { type: Date },
        followUpNotes: { type: String },
        lastFollowUpSentAt: { type: Date },
        followUpSentCount: { type: Number, default: 0 }
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
