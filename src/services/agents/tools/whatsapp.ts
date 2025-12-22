import { tool } from "langchain";
import { ConversationModel } from "../../../models/conversation.model";
import { MessageModel } from "../../../models/message.model";
import { CustomerModel } from "../../../models/customer.model";
import { WhatsAppService } from "../../whatsappService.service";
import z from "zod";
import { DocumentsService } from "../../documents.service";
import { DocumentProcessorService } from "../../documentProcessor.service";
import { VectorStoreService } from "../../pinecone.service";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { config } from "../../../config";


export class WhatsappToolService
{
    private whatsappService: WhatsAppService;
    private knowledgeBaseService: VectorStoreService;

    constructor ()
    {
        this.whatsappService = new WhatsAppService();
        this.knowledgeBaseService = new VectorStoreService();
    }

    sendMessageTool()
    {
        return tool(
            (input: { to: string; message: string; }) =>
            {
                console.log("Sending WhatsApp message", input);
                return this.whatsappService.sendMessage(
                    input.to,
                    input.message
                );

            },
            {
                name: "send_whatsapp_message",
                description: "Sends a WhatsApp message to a specified phone number.",
                schema: z.object({
                    to: z.string().min(10).max(15).describe("The recipient's phone number in international format."),
                    message: z.string().min(1).max(4096).describe("The content of the WhatsApp message to be sent.")
                })
            }
        );
    }

    fetchRecentMessagesTool()
    {
        return tool(async (input: { limit: number; conversationId: string; }) =>
        {

            console.log("Fetching recent WhatsApp messages", input);
            const messages = await MessageModel.find({
                conversationId: input.conversationId,
                direction: 'inbound'
            })
                .sort({ createdAt: -1 })
                .limit(input.limit)
                .lean();

            return messages.map(msg => msg.content);
        }, {
            name: "fetch_recent_whatsapp_messages",
            description: "Fetches recent WhatsApp messages from customers.",
            schema: z.object({
                limit: z.number().min(1).max(100).describe("The number of recent messages to fetch."),
                conversationId: z.string().describe("The ID of the organization to fetch messages for.")
            })
        });
    }

    getKnowledgeBaseTool()
    {
        return tool(async (input: { organizationId: string; topic: string; maxResults: number; }) =>
        {
            try {
                console.log("Searching WhatsApp knowledge base", input);
                const results = await this.knowledgeBaseService.searchSimilar(
                    input.organizationId,
                    input.topic,
                    input.maxResults
                );

                // Convert results to plain text instead of returning objects
                if (!results || results.length === 0) {
                    return "No relevant information found in the knowledge base.";
                }

                // Format the results as a readable string
                const formattedResults = results.map((result: any, index: number) =>
                {
                    return `Document ${index + 1} (Relevance: ${(result.score * 100).toFixed(1)}%):
${result.content}
---`;
                }).join('\n\n');

                return `Found ${results.length} relevant document(s):\n\n${formattedResults}`;
            } catch (error) {
                console.error('Error searching knowledge base:', error);
                return "Sorry, I encountered an error searching the knowledge base.";
            }
        }, {
            name: "get_whatsapp_knowledge_base",
            description: "Retrieves knowledge base information about the organization and what the product/service offers in relation to what the customer is asking about.",
            schema: z.object({
                organizationId: z.string().describe("The ID of the organization whose knowledge base is to be queried."),
                topic: z.string().min(1).max(100).describe("The topic to search for in the knowledge base."),
                maxResults: z.number().min(1).max(20).describe("The maximum number of articles to retrieve.")
            })
        });
    }

    getCustomerTool()
    {
        return tool(async (input: { customerId: string; organizationId: string; }) =>
        {
            console.log("Fetching customer", input);
            const customer = await CustomerModel.findOne({
                _id: input.customerId,
                organizationId: input.organizationId
            }).lean();

            if (!customer) return "Customer not found.";

            // Return a concise summary to the LLM
            const { _id, organizationId, whatsappNumber, name, email, language, metadata, tags, isBlocked } = customer as any;
            return {
                id: _id,
                organizationId,
                whatsappNumber,
                name,
                email,
                language,
                tags,
                isBlocked,
                metadata
            };
        }, {
            name: "get_customer",
            description: "Fetch a customer by id within an organization.",
            schema: z.object({
                customerId: z.string().describe("The customer id."),
                organizationId: z.string().describe("The organization id.")
            })
        });
    }

    updateCustomerTool()
    {
        return tool(async (input: {
            customerId: string;
            organizationId: string;
            name?: string;
            email?: string;
            language?: string;
            tags?: string[];
            metadata?: Record<string, any>;
            isBlocked?: boolean;
        }) =>
        {
            console.log("Updating customer", input);

            const update: Record<string, any> = {};
            if (input.name !== undefined) update.name = input.name;
            if (input.email !== undefined) update.email = input.email;
            if (input.language !== undefined) update.language = input.language;
            if (input.tags !== undefined) update.tags = input.tags;
            if (input.metadata !== undefined) update.metadata = input.metadata;
            if (input.isBlocked !== undefined) update.isBlocked = input.isBlocked;

            const result = await CustomerModel.findOneAndUpdate(
                { _id: input.customerId, organizationId: input.organizationId },
                { $set: update },
                { new: true }
            ).lean();

            if (!result) return "Customer not found.";

            const { _id, organizationId, whatsappNumber, name, email, language, metadata, tags, isBlocked } = result as any;
            return {
                id: _id,
                organizationId,
                whatsappNumber,
                name,
                email,
                language,
                tags,
                isBlocked,
                metadata
            };
        }, {
            name: "update_customer",
            description: "Update a customer's profile fields (name, email, language, tags, metadata, block flag).",
            schema: z.object({
                customerId: z.string().describe("The customer id."),
                organizationId: z.string().describe("The organization id."),
                name: z.string().min(1).max(200).optional(),
                email: z.string().email().optional(),
                language: z.string().max(10).optional(),
                tags: z.array(z.string()).max(50).optional(),
                metadata: z.record(z.string(), z.any()).optional(),
                isBlocked: z.boolean().optional()
            })
        });
    }

    assessProspectTool()
    {
        return tool(async (input: { customerId: string; organizationId: string; recentLimit?: number; }) =>
        {
            const recentLimit = input.recentLimit ?? 10;

            const conversation = await ConversationModel.findOne({
                customerId: input.customerId,
                organizationId: input.organizationId
            }).lean();

            if (!conversation) {
                await CustomerModel.updateOne(
                    { _id: input.customerId, organizationId: input.organizationId },
                    { $set: { lifecycleStage: 'unknown', prospectScore: 0 } }
                );
                return "No conversation found. Classification: unknown.";
            }

            const messages = await MessageModel.find({
                conversationId: conversation._id,
                direction: 'inbound'
            }).sort({ createdAt: -1 }).limit(recentLimit).lean();

            const text = messages.map(m => m.content).join('\n');

            // Heuristic baseline classification
            const keywords = [ 'price', 'quote', 'buy', 'purchase', 'interested', 'demo', 'trial', 'cost', 'plan' ];
            let hits = 0;
            const lower = (text || '').toLowerCase();
            for (const k of keywords) if (lower.includes(k)) hits++;
            let lifecycleStage: 'unknown' | 'lead' | 'prospect' | 'customer' | 'churnRisk' = 'unknown';
            let prospectScore = Math.min(1, hits / 5);
            let rationale = hits > 0 ? `Matched intent keywords: ${keywords.filter(k => lower.includes(k)).join(', ')}` : 'insufficient data';
            let suggestedFollowUpDays = hits > 0 ? 2 : 0;

            // Optional: try Gemini for refinement, tolerate failures
            try {
                if (config.env.GOOGLE_API_KEY) {
                    const model = new ChatGoogleGenerativeAI({ model: 'gemini-flash-latest', temperature: 0.2 });
                    const prompt = [
                        'Classify whether the customer is a prospect based on the messages. Return JSON with keys lifecycleStage(one of: unknown, lead, prospect, customer, churnRisk), prospectScore(0..1), rationale(string), suggestedFollowUpDays(integer).',
                        'Messages:',
                        text || '(no messages)'
                    ].join('\n');
                    const resp = await model.invoke([ { role: 'user', content: prompt } as any ]);
                    const raw = typeof (resp as any)?.content === 'string' ? (resp as any).content : JSON.stringify((resp as any)?.content);
                    const match = raw?.match(/\{[\s\S]*\}/)?.[ 0 ];
                    if (match) {
                        const parsed = JSON.parse(match);
                        lifecycleStage = parsed.lifecycleStage ?? lifecycleStage;
                        prospectScore = typeof parsed.prospectScore === 'number' ? parsed.prospectScore : prospectScore;
                        rationale = parsed.rationale ?? rationale;
                        suggestedFollowUpDays = typeof parsed.suggestedFollowUpDays === 'number' ? parsed.suggestedFollowUpDays : suggestedFollowUpDays;
                    }
                }
            } catch (e) {
                console.warn('Gemini classification failed, using heuristic.', e);
            }

            if (prospectScore >= 0.6) lifecycleStage = 'prospect';
            else if (prospectScore > 0.2) lifecycleStage = 'lead';

            await CustomerModel.updateOne(
                { _id: input.customerId, organizationId: input.organizationId },
                {
                    $set: {
                        lifecycleStage,
                        prospectScore,
                        followUpNotes: rationale,
                        nextFollowUpAt: suggestedFollowUpDays > 0 ? new Date(Date.now() + suggestedFollowUpDays * 24 * 60 * 60 * 1000) : undefined
                    }
                }
            );

            return `Classification: ${lifecycleStage} (score ${prospectScore.toFixed(2)}). ${rationale}`;
        }, {
            name: 'assess_customer_prospect',
            description: 'Classify if a customer is a prospect based on recent inbound messages and persist results.',
            schema: z.object({
                customerId: z.string().describe('The customer id.'),
                organizationId: z.string().describe('The organization id.'),
                recentLimit: z.number().min(1).max(50).optional()
            })
        });
    }

    scheduleFollowUpTool()
    {
        return tool(async (input: { customerId: string; organizationId: string; followUpAt: string; notes?: string; }) =>
        {
            const when = new Date(input.followUpAt);
            if (isNaN(when.getTime())) return 'Invalid followUpAt date.';

            await CustomerModel.updateOne(
                { _id: input.customerId, organizationId: input.organizationId },
                { $set: { nextFollowUpAt: when, followUpNotes: input.notes ?? '' } }
            );

            return `Follow-up scheduled for ${when.toISOString()}`;
        }, {
            name: 'schedule_customer_followup',
            description: 'Schedule a follow-up by setting nextFollowUpAt and optional notes.',
            schema: z.object({
                customerId: z.string().describe('The customer id.'),
                organizationId: z.string().describe('The organization id.'),
                followUpAt: z.string().describe('ISO datetime for the follow-up.'),
                notes: z.string().max(500).optional()
            })
        });
    }
}
