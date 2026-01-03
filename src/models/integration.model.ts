import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IntegrationType } from './enums';

export interface Integration extends Document<string>
{
    _id: string;
    organizationId: string;
    type: IntegrationType;
    name: string;
    config: Record<string, unknown>;
    isActive: boolean;
    lastTestedAt?: Date;
    testStatus?: 'success' | 'failed';
    createdAt: Date;
    updatedAt: Date;
}

const IntegrationSchema = new Schema<any>(
    {
        _id: { type: String, default: uuidv4 },
        organizationId: { type: String, required: true, ref: 'Organization' },
        type: { type: String, enum: Object.values(IntegrationType), required: true },
        name: { type: String, required: true },
        config: { type: Schema.Types.Mixed, default: {} },
        isActive: { type: Boolean, default: true },
        lastTestedAt: { type: Date },
        testStatus: { type: String, enum: ['success', 'failed'] }
    },
    { timestamps: true }
);

IntegrationSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: any) =>
    {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
});

export const IntegrationModel = model<Integration>('Integration', IntegrationSchema, 'integrations');
