import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ConversationStatus, Priority } from './enums';

export interface Conversation extends Document<string>
{
    _id: string;
    organizationId: string;
    customerId: string;
    status: ConversationStatus;
    assignedToId?: string;
    priority: Priority;
    startedAt: Date;
    endedAt?: Date;
    lastMessageAt: Date;
    metadata: Record<string, unknown>;
}

const ConversationSchema = new Schema<any>(
    {
        _id: { type: String, default: uuidv4 },
        organizationId: { type: String, required: true, ref: 'Organization' },
        customerId: { type: String, required: true, ref: 'Customer' },
        status: { type: String, enum: Object.values(ConversationStatus), default: ConversationStatus.ACTIVE },
        assignedToId: { type: String, ref: 'User' },
        priority: { type: String, enum: Object.values(Priority), default: Priority.MEDIUM },
        startedAt: { type: Date, default: Date.now },
        endedAt: { type: Date },
        lastMessageAt: { type: Date, default: Date.now },
        metadata: { type: Schema.Types.Mixed, default: {} }
    },
    { versionKey: false }
);

ConversationSchema.index({ customerId: 1, status: 1 });
ConversationSchema.index({ status: 1, assignedToId: 1 });

ConversationSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret: any) =>
    {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
});

export const ConversationModel = model<Conversation>('Conversation', ConversationSchema, 'conversations');
