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
    async list(organizationId: string): Promise<DocumentEntity[]>
    {
        return DocumentModel.find({ organizationId }).lean();
    }

    async getById(id: string, organizationId: string): Promise<DocumentEntity | null>
    {
        return DocumentModel.findOne({ _id: id, organizationId }).lean();
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

    async remove(id: string, organizationId: string): Promise<boolean>
    {
        const doc = await DocumentModel.findOneAndDelete({ _id: id, organizationId });
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

        console.log('\n\n\nUploading document with input:', input);
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

        // Process and store in vector store in the background
        this.processDocumentInBackground(created._id.toString(), input);

        return created.toJSON() as any;
    }

    private async processDocumentInBackground(documentId: string, input: any): Promise<void>
    {
        try {
            const processedDocument = await this.documentProcessorService.processDocument(
                input.fileUrl,
                input.type,
                documentId,
                input.name
            );

            // Store in Vector Store
            const vectorIds = await this.vectorStoreService.addDocument(
                input.organizationId,
                documentId,
                processedDocument.chunks
            );

            await DocumentChunkModel.insertMany(
                processedDocument.chunks.map((c, index) => ({
                    documentId: documentId,
                    content: c.content,
                    chunkIndex: c.chunkIndex,
                    vectorId: vectorIds[ index ]
                }))
            );

            await DocumentModel.findByIdAndUpdate(documentId, {
                status: ProcessStatus.COMPLETED,
                processedAt: new Date()
            });
        } catch (error) {
            console.error(`Failed to process document ${documentId}:`, error);
            await DocumentModel.findByIdAndUpdate(documentId, {
                status: ProcessStatus.FAILED,
                processedAt: new Date()
            });
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

    async reprocess(id: string, organizationId: string): Promise<DocumentEntity | null>
    {
        return DocumentModel.findOneAndUpdate(
            { _id: id, organizationId },
            { status: ProcessStatus.PENDING, processedAt: undefined },
            { new: true }
        ).lean();
    }

    async status(organizationId: string): Promise<Record<string, number>>
    {
        const agg = await DocumentModel.aggregate([
            { $match: { organizationId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const out: Record<string, number> = {};
        for (const row of agg) out[ row._id ] = row.count;
        return out;
    }
}
