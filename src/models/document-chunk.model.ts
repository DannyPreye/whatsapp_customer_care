import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentChunk extends Document<string>
{
    _id: string;
    documentId: string;
    content: string;
    chunkIndex: number;
    vectorId: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
}

const DocumentChunkSchema = new Schema<any>(
    {
        _id: { type: String, default: uuidv4 },
        documentId: { type: String, required: true, ref: 'Document' },
        content: { type: String, required: true },
        chunkIndex: { type: Number, required: true },
        vectorId: { type: String, required: true },
        metadata: { type: Schema.Types.Mixed, default: {} },
        createdAt: { type: Date, default: Date.now }
    },
    { versionKey: false }
);

DocumentChunkSchema.index({ documentId: 1 });

DocumentChunkSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret: any) =>
    {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
});

export const DocumentChunkModel = model<DocumentChunk>('DocumentChunk', DocumentChunkSchema, 'document_chunks');
