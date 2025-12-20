import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { DocumentType, ProcessStatus } from './enums';

export interface DocumentEntity extends Document<string>
{
    _id: string;
    organizationId: string;
    name: string;
    originalName: string;
    type: DocumentType;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    status: ProcessStatus;
    vectorIds: string[];
    metadata: Record<string, unknown>;
    uploadedBy: string;
    createdAt: Date;
    updatedAt: Date;
    processedAt?: Date;
}

const DocumentSchema = new Schema<any>(
    {
        _id: { type: String, default: uuidv4 },
        organizationId: { type: String, required: true, ref: 'Organization' },
        name: { type: String, required: true },
        originalName: { type: String, required: true },
        type: { type: String, enum: Object.values(DocumentType), required: true },
        fileUrl: { type: String, required: true },
        fileSize: { type: Number, required: true },
        mimeType: { type: String, required: true },
        status: { type: String, enum: Object.values(ProcessStatus), default: ProcessStatus.PENDING },
        vectorIds: { type: [ String ], default: [] },
        metadata: { type: Schema.Types.Mixed, default: {} },
        uploadedBy: { type: String, required: true, ref: 'User' },
        processedAt: { type: Date }
    },
    { timestamps: true }
);

DocumentSchema.index({ organizationId: 1, status: 1 });

DocumentSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: any) =>
    {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
});

export const DocumentModel = model<DocumentEntity>('Document', DocumentSchema, 'documents');
