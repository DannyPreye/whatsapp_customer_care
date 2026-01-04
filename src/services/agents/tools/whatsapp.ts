import { tool } from "langchain";
import { ConversationModel } from "../../../models/conversation.model";
import { MessageModel } from "../../../models/message.model";
import { CustomerModel } from "../../../models/customer.model";
import { OrganizationModel } from "../../../models/organization.model";
import { IntegrationModel } from "../../../models/integration.model";
import { WhatsAppService } from "../../whatsappService.service";
import { baileysManager } from "../../baileysManager.service";
import z from "zod";
import { VectorStoreService } from "../../pinecone.service";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { config } from "../../../config";
import { Direction, MessageStatus, MessageType } from "../../../models/enums";
import { ChatOpenAI, OpenAI } from "@langchain/openai";
import { IntegrationFactory } from "../../integrations/integration.factory";


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
            async (input: { to: string; message: string; organizationId?: string; }) =>
            {
                console.log("Sending WhatsApp message", input);


                try {
                    // If organizationId is provided, check auth type and route accordingly
                    if (input.organizationId) {
                        const org = await OrganizationModel.findById(input.organizationId).lean();

                        if (!org) {
                            console.error(`Organization not found: ${input.organizationId}`);
                            throw new Error(`Organization not found: ${input.organizationId}`);
                        }

                        console.log(`[Agent Tool] Sending via ${org.whatsappAuthType} for org ${input.organizationId}`);

                        // Route based on organization's auth type
                        if (org.whatsappAuthType === 'baileys') {
                            console.log(`[Agent Tool] Using Baileys to send message to ${input.to}`);
                            return await baileysManager.sendMessage(input.organizationId, input.to, input.message);
                        } else {
                            console.log(`[Agent Tool] Using OAuth WhatsAppService to send message to ${input.to}`);
                            return await this.whatsappService.sendMessage(input.to, input.message, input.organizationId);
                        }
                    } else {
                        // Fallback to default WhatsAppService if no organizationId
                        console.log(`[Agent Tool] No organizationId provided, using default WhatsAppService`);
                        return await this.whatsappService.sendMessage(input.to, input.message);
                    }
                } catch (error) {
                    // console.error(`Error sending WhatsApp message:`, error);
                    throw error;
                }
            },
            {
                name: "send_whatsapp_message",
                description: "Sends a WhatsApp message to a specified phone number. Always use this tool to send messages.",
                schema: z.object({
                    to: z.string().min(10).max(15).describe("The recipient's phone number in international format."),
                    message: z.string().min(1).max(4096).describe("The content of the WhatsApp message to be sent."),
                    organizationId: z.string().describe("The organization ID to determine the sending method (OAuth or Baileys). Please always provide this.")
                })
            }
        );
    }

    /**
     * Persist an outbound AI/agent message to the same conversation
     * so the history remains complete even for tool-sent replies.
     */
    saveSentMessageTool()
    {
        return tool(async (input: {
            conversationId: string;
            content: string;
            aiConfidence?: number;
            whatsappId?: string;
            metadata?: Record<string, any>;
        }) =>
        {
            console.log("Saving outbound AI message", input);

            const message = await MessageModel.create({
                conversationId: input.conversationId,
                whatsappId: input.whatsappId,
                direction: Direction.OUTBOUND,
                type: MessageType.TEXT,
                content: input.content,
                metadata: input.metadata ?? {},
                status: MessageStatus.SENT,
                isFromAgent: true,
                aiGenerated: true,
                confidence: input.aiConfidence
            } as any);

            // Keep conversation freshness up to date
            await ConversationModel.updateOne(
                { _id: input.conversationId },
                { $set: { lastMessageAt: new Date() } }
            );

            return {
                id: (message as any)._id,
                conversationId: input.conversationId,
                status: "saved"
            };
        }, {
            name: "save_sent_whatsapp_message",
            description: "Save the AI/agent's sent message into the same conversation as an OUTBOUND text.",
            schema: z.object({
                conversationId: z.string().describe("The target conversation id to append the message to."),
                content: z.string().min(1).max(4096).describe("The text content that was sent to the user."),
                aiConfidence: z.number().min(0).max(1).optional().describe("Optional confidence score from the AI for this reply."),
                whatsappId: z.string().optional().describe("Optional underlying WhatsApp provider message id, if available."),
                metadata: z.record(z.string(), z.any()).optional().describe("Optional extra metadata to store with the message.")
            })
        });
    }

    fetchRecentMessagesTool()
    {
        return tool(async (input: { limit: number; conversationId: string; }) =>
        {

            const messages = await MessageModel.find({
                conversationId: input.conversationId
            })
                .sort({ createdAt: -1 })
                .limit(input.limit)
                .lean();

            // Return a concise transcript with direction and timestamp context
            const cleanMessages = messages.map(msg =>
            {
                const when = msg.createdAt instanceof Date ? msg.createdAt.toISOString() : String(msg.createdAt);
                const dir = msg.direction === Direction.INBOUND ? 'IN' : 'OUT';
                return `[${when}] ${dir}: ${msg.content}`;
            });

            console.log("Fetched messages:", cleanMessages);

            return cleanMessages;
        }, {
            name: "fetch_recent_whatsapp_messages",
            description: "Fetches recent WhatsApp messages (inbound and outbound) for the conversation, newest first.",
            schema: z.object({
                limit: z.number().min(1).max(100).describe("The number of recent messages to fetch."),
                conversationId: z.string().describe("The conversation id to fetch messages for.")
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
                    return "No relevant information found in the knowledge base. Tell the customer you'll find out and ask a quick clarifying question.";
                }

                // Format the results as a readable string
                const formattedResults = results.map((result: any, index: number) =>
                {
                    return `Document ${index + 1} (Relevance: ${(result.score * 100).toFixed(1)}%):
${result.content}
---`;
                }).join('\n\n');

                return `Found ${results.length} relevant document(s). Summarize briefly for the customer in natural WhatsApp style, then ask a next-step question.\n\n${formattedResults}`;
            } catch (error) {
                console.error('Error searching knowledge base:', error);
                return "Sorry, I hit an error searching the knowledge base. Let the customer know you'll check and get back with the right info.";
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
        return tool(async (input: { customerId: string; organizationId: string; conversationId?: string; recentLimit?: number; }) =>
        {
            const recentLimit = input.recentLimit ?? 10;

            // Use provided conversationId or look it up
            let conversationId = input.conversationId;
            if (!conversationId) {
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
                conversationId = (conversation as any)._id.toString();
            }

            const messages = await MessageModel.find({
                conversationId,
                direction: Direction.INBOUND // Only analyze customer messages
            }).sort({ createdAt: -1 }).limit(recentLimit).lean();

            const text = messages.map(m => m.content).join('\n');

            // Heuristic baseline classification
            const buyingKeywords = [ 'price', 'quote', 'buy', 'purchase', 'cost', 'how much' ];
            const interestKeywords = [ 'interested', 'demo', 'trial', 'learn more', 'tell me more' ];
            const urgencyKeywords = [ 'today', 'now', 'asap', 'urgent', 'quickly', 'soon' ];

            let buyingHits = 0;
            let interestHits = 0;
            let urgencyHits = 0;
            const lower = (text || '').toLowerCase();

            for (const k of buyingKeywords) if (lower.includes(k)) buyingHits++;
            for (const k of interestKeywords) if (lower.includes(k)) interestHits++;
            for (const k of urgencyKeywords) if (lower.includes(k)) urgencyHits++;

            let lifecycleStage: 'unknown' | 'lead' | 'prospect' | 'customer' | 'churnRisk' = 'unknown';
            let prospectScore = Math.min(1, (buyingHits * 0.3 + interestHits * 0.15 + urgencyHits * 0.1));
            let rationale = buyingHits + interestHits > 0
                ? `Matched keywords - Buying: ${buyingHits}, Interest: ${interestHits}, Urgency: ${urgencyHits}`
                : 'No strong buying signals detected';
            let suggestedFollowUpDays = buyingHits > 0 ? 1 : (interestHits > 0 ? 2 : 7);

            // Use AI for better classification if messages exist
            if (text && text.length > 10) {
                try {
                    const model = new ChatOpenAI({
                        temperature: 0.2, // Low temperature for consistent classification
                        model: "gpt-4o",
                        modelKwargs: {
                            response_format: { type: "json_object" }
                        }
                    });

                    const prompt = `Analyze these WhatsApp messages from a customer and classify their intent. Return ONLY valid JSON with these exact keys:
{
  "lifecycleStage": "unknown" | "lead" | "prospect" | "customer" | "churnRisk",
  "prospectScore": 0.0 to 1.0,
  "rationale": "brief explanation",
  "suggestedFollowUpDays": integer (1-14)
}

Classification criteria:
- unknown: No clear intent (score: 0-0.2)
- lead: Showing interest, asking questions (score: 0.2-0.5)
- prospect: Clear buying signals, asking about pricing/demos (score: 0.5-0.8)
- customer: Already purchased or ready to buy (score: 0.8-1.0)
- churnRisk: Existing customer showing dissatisfaction

Customer messages:
${text}`;

                    const resp = await model.invoke([ { role: 'user', content: prompt } as any ]);
                    const content = typeof (resp as any)?.content === 'string'
                        ? (resp as any).content
                        : JSON.stringify((resp as any)?.content);

                    const parsed = JSON.parse(content);

                    if (parsed.lifecycleStage) lifecycleStage = parsed.lifecycleStage;
                    if (typeof parsed.prospectScore === 'number') prospectScore = Math.min(1, Math.max(0, parsed.prospectScore));
                    if (parsed.rationale) rationale = parsed.rationale;
                    if (typeof parsed.suggestedFollowUpDays === 'number') suggestedFollowUpDays = parsed.suggestedFollowUpDays;
                } catch (e) {
                    console.warn('AI classification failed, using heuristic:', e);
                    // Fall back to heuristic values already calculated
                }
            }

            // Final stage determination based on score
            if (prospectScore >= 0.8) lifecycleStage = 'customer';
            else if (prospectScore >= 0.5) lifecycleStage = 'prospect';
            else if (prospectScore >= 0.2) lifecycleStage = 'lead';

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

            return `Customer assessed: ${lifecycleStage} (score: ${prospectScore.toFixed(2)}). ${rationale}. Follow-up in ${suggestedFollowUpDays} days.`;
        }, {
            name: 'assess_customer_prospect',
            description: 'REQUIRED: Analyze customer buying intent from conversation messages and update their lifecycle stage. Must be called after every customer interaction.',
            schema: z.object({
                customerId: z.string().describe('The customer id.'),
                organizationId: z.string().describe('The organization id.'),
                conversationId: z.string().optional().describe('The conversation id (if known, avoids lookup).'),
                recentLimit: z.number().min(1).max(50).optional().describe('Number of recent messages to analyze (default: 10).')
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

    shareIntegrationResourceTool()
    {
        return tool(
            async (input: {
                customerId: string;
                organizationId: string;
                conversationId: string;
                integrationType: string;
                resourceType: string;
                customMessage?: string;
            }) =>
            {
                console.log("Sharing integration resource", input);

                try {
                    // Find active integration of the requested type
                    const integration = await IntegrationModel.findOne({
                        organizationId: input.organizationId,
                        type: input.integrationType,
                        isActive: true
                    }).lean();

                    if (!integration) {
                        return `No active ${input.integrationType} integration found. Organization needs to connect it first.`;
                    }

                    // Get the appropriate service for this integration
                    const integrationService = IntegrationFactory.getIntegrationService(integration as any);

                    // Verify integration still works
                    const isValid = await integrationService.testConnection();
                    if (!isValid) {
                        return `${input.integrationType} integration is invalid. Please reconnect it.`;
                    }

                    // Get the resource data (e.g., calendly URL)
                    const resourceData = await integrationService.getData({
                        type: input.resourceType
                    });

                    // Fetch customer
                    const customer = await CustomerModel.findById(input.customerId).lean();
                    if (!customer) return "Customer not found.";

                    // Build message
                    const defaultMessage = this.getDefaultMessageForIntegration(
                        input.integrationType,
                        resourceData
                    );
                    const messageToSend = input.customMessage || defaultMessage;

                    // Send message
                    const org = await OrganizationModel.findById(input.organizationId).lean();
                    if (!org) return "Organization not found.";

                    if (org.whatsappAuthType === 'baileys') {
                        await baileysManager.sendMessage(input.organizationId, (customer as any).whatsappNumber, messageToSend);
                    } else {
                        await this.whatsappService.sendMessage((customer as any).whatsappNumber, messageToSend, input.organizationId);
                    }

                    // Save message to conversation
                    await MessageModel.create({
                        conversationId: input.conversationId,
                        direction: Direction.OUTBOUND,
                        type: MessageType.TEXT,
                        content: messageToSend,
                        status: MessageStatus.SENT,
                        isFromAgent: true,
                        aiGenerated: true,
                        metadata: {
                            integration: input.integrationType,
                            resourceType: input.resourceType
                        }
                    } as any);

                    // Update conversation lastMessageAt
                    await ConversationModel.updateOne(
                        { _id: input.conversationId },
                        { $set: { lastMessageAt: new Date() } }
                    );

                    return `${input.integrationType} resource shared successfully.`;
                } catch (error) {
                    console.error('Error sharing integration resource:', error);
                    throw error;
                }
            },
            {
                name: "share_integration_resource",
                description: "Share a resource from a connected integration (e.g., Calendly link, payment link, etc.) with the customer via WhatsApp.",
                schema: z.object({
                    customerId: z.string().describe("The customer id."),
                    organizationId: z.string().describe("The organization id."),
                    conversationId: z.string().describe("The conversation id to save the message."),
                    integrationType: z.string().describe("Type of integration (e.g., 'calendly', 'stripe', 'slack')."),
                    resourceType: z.string().describe("Type of resource to share (e.g., 'calendar_url', 'payment_link')."),
                    customMessage: z.string().max(4096).optional().describe("Custom message to send with the resource.")
                })
            }
        );
    }

    /**
     * Helper to get default messages for different integrations
     */
    private getDefaultMessageForIntegration(integrationType: string, resourceData: any): string
    {
        const defaults: Record<string, string> = {
            'calendly': `I'd love to schedule a time to chat! Here's my calendar:\n${resourceData.url}`,
            'stripe': `You can complete your payment here:\n${resourceData.url}`,
            'slack': `Join our community Slack:\n${resourceData.url}`,
        };

        return defaults[ integrationType ] || `Check this out:\n${JSON.stringify(resourceData)}`;
    }
}
