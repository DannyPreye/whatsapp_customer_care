import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { config } from '../config';


export class VectorStoreService
{
    private pinecone: Pinecone;
    private embeddings: GoogleGenerativeAIEmbeddings;
    private indexName: string;

    constructor ()
    {
        this.pinecone = new Pinecone({
            apiKey: config.env.PINECONE_API_KEY || '',
            // environment: process.env.PINECONE_ENVIRONMENT || ''
        });

        this.embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: config.env.GOOGLE_API_KEY,
            modelName: "embedding-001"
        });

        this.indexName = config.env.PINECONE_INDEX_NAME || 'default-index';
    }

    async getIndex(organizationId: string)
    {
        // Use namespaces to isolate organization data
        return this.pinecone.index(this.indexName).namespace(organizationId);
    }

    async addDocument(organizationId: string,
        documentId: string,
        chunks: Array<{
            id: string;
            content: string;
            metadata: Record<string, any>;
        }>)
    {
        const index = await this.getIndex(organizationId);

        // Generate embeddings for each chunk
        const texts = chunks.map((c) => c.content);
        const embeddings = await this.embeddings.embedDocuments(texts);

        // Prepare vectors for upsert
        const vectors = chunks.map((chunk, i) => ({
            id: chunk.id,
            values: embeddings[ i ],
            metadata: {
                ...chunk.metadata,
                organizationId,
                documentId,
                content: chunk.content,
            },
        }));

        // Upsert in batches of 100
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            await index.upsert(batch);
        }

        return vectors.map((v) => v.id);
    }

    async searchSimilar(
        organizationId: string,
        query: string,
        topK: number = 5,
        filter?: Record<string, any>
    )
    {
        const index = await this.getIndex(organizationId);

        // Generate query embedding
        const queryEmbedding = await this.embeddings.embedQuery(query);

        // Search
        const results = await index.query({
            vector: queryEmbedding,
            topK,
            includeMetadata: true,
            filter,
        });

        return results.matches?.map((match) => ({
            id: match.id,
            score: match.score,
            content: match.metadata?.content as string,
            metadata: match.metadata,
        })) || [];
    }

    async deleteDocument(organizationId: string, documentId: string)
    {
        const index = await this.getIndex(organizationId);

        // Delete all vectors for this document
        await index.deleteMany({
            filter: { documentId },
        });
    }

    async deleteOrganizationData(organizationId: string)
    {
        // Delete entire namespace
        await this.pinecone.index(this.indexName).namespace(organizationId).deleteAll();
    }

}
