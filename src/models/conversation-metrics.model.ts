import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ConversationMetrics extends Document<string>
{
    _id: string;
    organizationId: string;
    date: Date;
    totalConversations: number;
    resolvedByAI: number;
    handedOffToHuman: number;
    averageResponseTime?: number;
    averageResolutionTime?: number;
    customerSatisfaction?: number;
    createdAt: Date;
}

const ConversationMetricsSchema = new Schema<any>(
    {
        _id: { type: String, default: uuidv4 },
        organizationId: { type: String, required: true, ref: 'Organization' },
        date: { type: Date, required: true },
        totalConversations: { type: Number, default: 0 },
        resolvedByAI: { type: Number, default: 0 },
        handedOffToHuman: { type: Number, default: 0 },
        averageResponseTime: { type: Number },
        averageResolutionTime: { type: Number },
        customerSatisfaction: { type: Number },
        createdAt: { type: Date, default: Date.now }
    },
    { versionKey: false }
);

ConversationMetricsSchema.index({ organizationId: 1, date: 1 }, { unique: true });

ConversationMetricsSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret: any) =>
    {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
});

export const ConversationMetricsModel = model<ConversationMetrics>(
    'ConversationMetrics',
    ConversationMetricsSchema,
    'conversation_metrics'
);
