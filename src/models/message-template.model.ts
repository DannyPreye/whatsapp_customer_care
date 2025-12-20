import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface MessageTemplate extends Document<string>
{
    _id: string;
    organizationId: string;
    name: string;
    category: string;
    language: string;
    content: string;
    variables: string[];
    isActive: boolean;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const MessageTemplateSchema = new Schema<any>(
    {
        _id: { type: String, default: uuidv4 },
        organizationId: { type: String, required: true, ref: 'Organization' },
        name: { type: String, required: true },
        category: { type: String, required: true },
        language: { type: String, default: 'en' },
        content: { type: String, required: true },
        variables: { type: [ String ], default: [] },
        isActive: { type: Boolean, default: true },
        usageCount: { type: Number, default: 0 }
    },
    { timestamps: true }
);

MessageTemplateSchema.index({ organizationId: 1, name: 1 }, { unique: true });

MessageTemplateSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: any) =>
    {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
});

export const MessageTemplateModel = model<MessageTemplate>(
    'MessageTemplate',
    MessageTemplateSchema,
    'message_templates'
);
