import { DocumentModel, DocumentEntity } from '../models/document.model';
import { DocumentChunkModel } from '../models/document-chunk.model';
import { ProcessStatus, DocumentType } from '../models/enums';
import { VectorStoreService } from './pinecone.service';
import { DocumentProcessorService } from './documentProcessor.service';


export class DocumentsService
{
    private documentProcessorService: DocumentProcessorService;
    private vectorStoreService: VectorStoreService;

    constructor ()
    {
        this.documentProcessorService = new DocumentProcessorService();
        this.vectorStoreService = new VectorStoreService();
    }
    async list(): Promise<DocumentEntity[]>
    {
        return DocumentModel.find().lean();
    }

    async getById(id: string): Promise<DocumentEntity | null>
    {
        return DocumentModel.findById(id).lean();
    }

    async searchKnowledgeBase(
        organizationId: string,
        query: string,
        topK: number = 5,
        filters?: Record<string, any>
    )
    {
        return await this.vectorStoreService.searchSimilar(
            organizationId,
            query,
            topK,
            filters
        );
    }

    async remove(id: string): Promise<boolean>
    {
        const doc = await DocumentModel.findByIdAndDelete(id);
        if (!doc) return false;

        await this.vectorStoreService.deleteDocument(doc.organizationId, id);
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
        try {
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

            const processedDocument = await this.documentProcessorService.processDocument(
                input.fileUrl,
                input.type,
                created._id.toString(),
                input.name
            );

            // Store in Vector Store
            const vectorIds = await this.vectorStoreService.addDocument(
                input.organizationId,
                created._id.toString(),
                processedDocument.chunks
            );

            await DocumentChunkModel.insertMany(
                processedDocument.chunks.map((c, index) => ({
                    documentId: created._id,
                    content: c.content,
                    chunkIndex: c.chunkIndex,
                    vectorId: vectorIds[ index ]
                }))
            );

            await DocumentModel.findByIdAndUpdate(created._id, {
                status: ProcessStatus.COMPLETED,
                processedAt: new Date()
            });



            return created.toJSON() as any;
        } catch (error) {

            await DocumentModel.findByIdAndUpdate(input.organizationId, {
                status: ProcessStatus.FAILED,
                processedAt: new Date()
            });
            throw error;
        }
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
