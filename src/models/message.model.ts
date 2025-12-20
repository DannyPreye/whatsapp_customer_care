import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Direction, MessageType, MessageStatus } from './enums';

export interface Message extends Document<string>
{
    _id: string;
    conversationId: string;
    whatsappId?: string;
    direction: Direction;
    type: MessageType;
    content: string;
    metadata: Record<string, unknown>;
    status: MessageStatus;
    isFromAgent: boolean;
    aiGenerated: boolean;
    confidence?: number;
    createdAt: Date;
    deliveredAt?: Date;
    readAt?: Date;
}

const MessageSchema = new Schema<any>(
    {
        _id: { type: String, default: uuidv4 },
        conversationId: { type: String, required: true, ref: 'Conversation' },
        whatsappId: { type: String, unique: true, sparse: true },
        direction: { type: String, enum: Object.values(Direction), required: true },
        type: { type: String, enum: Object.values(MessageType), default: MessageType.TEXT },
        content: { type: String, required: true },
        metadata: { type: Schema.Types.Mixed, default: {} },
        status: { type: String, enum: Object.values(MessageStatus), default: MessageStatus.SENT },
        isFromAgent: { type: Boolean, default: false },
        aiGenerated: { type: Boolean, default: false },
        confidence: { type: Number },
        createdAt: { type: Date, default: Date.now },
        deliveredAt: { type: Date },
        readAt: { type: Date }
    },
    { versionKey: false }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

MessageSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret: any) =>
    {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
});

export const MessageModel = model<Message>('Message', MessageSchema, 'messages');
