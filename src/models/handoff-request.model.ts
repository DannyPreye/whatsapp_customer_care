import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { HandoffStatus, Priority } from './enums';

export interface HandoffRequest extends Document<string>
{
    _id: string;
    conversationId: string;
    reason: string;
    status: HandoffStatus;
    priority: Priority;
    assignedToId?: string;
    notes?: string;
    requestedAt: Date;
    assignedAt?: Date;
    resolvedAt?: Date;
}

const HandoffRequestSchema = new Schema<any>(
    {
        _id: { type: String, default: uuidv4 },
        conversationId: { type: String, required: true, ref: 'Conversation' },
        reason: { type: String, required: true },
        status: { type: String, enum: Object.values(HandoffStatus), default: HandoffStatus.PENDING },
        priority: { type: String, enum: Object.values(Priority), default: Priority.MEDIUM },
        assignedToId: { type: String, ref: 'User' },
        notes: { type: String },
        requestedAt: { type: Date, default: Date.now },
        assignedAt: { type: Date },
        resolvedAt: { type: Date }
    },
    { versionKey: false }
);

HandoffRequestSchema.index({ status: 1, priority: 1 });

HandoffRequestSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret: any) =>
    {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
});

export const HandoffRequestModel = model<HandoffRequest>('HandoffRequest', HandoffRequestSchema, 'handoff_requests');
