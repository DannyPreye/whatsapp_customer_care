import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { NotificationType } from './enums';

export interface Notification extends Document<string>
{
    _id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data: Record<string, unknown>;
    isRead: boolean;
    createdAt: Date;
    readAt?: Date;
}

const NotificationSchema = new Schema<any>(
    {
        _id: { type: String, default: uuidv4 },
        userId: { type: String, required: true, ref: 'User' },
        type: { type: String, enum: Object.values(NotificationType), required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        data: { type: Schema.Types.Mixed, default: {} },
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        readAt: { type: Date }
    },
    { versionKey: false }
);

NotificationSchema.index({ userId: 1, isRead: 1 });

NotificationSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret: any) =>
    {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
});

export const NotificationModel = model<Notification>('Notification', NotificationSchema, 'notifications');
