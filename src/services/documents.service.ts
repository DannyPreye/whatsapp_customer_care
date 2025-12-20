import { DocumentModel, DocumentEntity } from '../models/document.model';
import { DocumentChunkModel } from '../models/document-chunk.model';
import { ProcessStatus, DocumentType } from '../models/enums';

export class DocumentsService
{
    async list(): Promise<DocumentEntity[]>
    {
        return DocumentModel.find().lean();
    }

    async getById(id: string): Promise<DocumentEntity | null>
    {
        return DocumentModel.findById(id).lean();
    }

    async remove(id: string): Promise<boolean>
    {
        const doc = await DocumentModel.findByIdAndDelete(id);
        if (!doc) return false;
        await DocumentChunkModel.deleteMany({ documentId: id });
        return true;
    }

    async upload(input: {
        organizationId: string;
        name: string;
        originalName: string;
        type: DocumentType;
        fileUrl: string;
        fileSize: number;
        mimeType: string;
        uploadedBy: string;
        content?: string;
    }): Promise<DocumentEntity>
    {
        const created = await DocumentModel.create({
            organizationId: input.organizationId,
            name: input.name,
            originalName: input.originalName,
            type: input.type,
            fileUrl: input.fileUrl,
            fileSize: input.fileSize,
            mimeType: input.mimeType,
            uploadedBy: input.uploadedBy,
            status: ProcessStatus.PENDING
        });

        if (input.content) {
            const chunkSize = 1000;
            const chunks = [] as Array<{ content: string; chunkIndex: number; vectorId: string; }>;
            for (let i = 0; i < input.content.length; i += chunkSize) {
                chunks.push({
                    content: input.content.slice(i, i + chunkSize),
                    chunkIndex: Math.floor(i / chunkSize),
                    vectorId: ''
                });
            }
            await DocumentChunkModel.insertMany(
                chunks.map((c) => ({ documentId: created._id, content: c.content, chunkIndex: c.chunkIndex, vectorId: c.vectorId }))
            );
        }

        return created.toJSON() as any;
    }

    async bulkUpload(items: Array<any>)
    {
        const results = [] as DocumentEntity[];
        for (const item of items) {
            const doc = await this.upload(item);
            results.push(doc as any);
        }
        return results;
    }

    async reprocess(id: string): Promise<DocumentEntity | null>
    {
        return DocumentModel.findByIdAndUpdate(id, { status: ProcessStatus.PENDING, processedAt: undefined }, { new: true }).lean();
    }

    async status(): Promise<Record<string, number>>
    {
        const agg = await DocumentModel.aggregate([ { $group: { _id: '$status', count: { $sum: 1 } } } ]);
        const out: Record<string, number> = {};
        for (const row of agg) out[ row._id ] = row.count;
        return out;
    }
}
