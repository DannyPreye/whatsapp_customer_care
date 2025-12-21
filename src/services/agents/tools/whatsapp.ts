import { tool } from "langchain";
import { ConversationModel } from "../../../models/conversation.model";
import { MessageModel } from "../../../models/message.model";
import { CustomerModel } from "../../../models/customer.model";
import { WhatsAppService } from "../../whatsappService.service";
import z from "zod";
import { DocumentsService } from "../../documents.service";
import { DocumentProcessorService } from "../../documentProcessor.service";
import { VectorStoreService } from "../../pinecone.service";


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

            const messages = await MessageModel.find({
                conversationId: input.conversationId,
                direction: 'inbound'
            })
                .sort({ createdAt: -1 })
                .limit(input.limit)
                .lean();
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
        return tool((input: { organizationId: string; topic: string; maxResults: number; }) =>
        {
            return this.knowledgeBaseService.searchSimilar(
                input.organizationId,
                input.topic,
                input.maxResults
            );
        }, {
            name: "get_whatsapp_knowledge_base",
            description: "Retrieves knowledge base articles related to WhatsApp messaging.",
            schema: z.object({
                organizationId: z.string().describe("The ID of the organization whose knowledge base is to be queried."),
                topic: z.string().min(1).max(100).describe("The topic to search for in the knowledge base."),
                maxResults: z.number().min(1).max(20).describe("The maximum number of articles to retrieve.")
            })
        });
    }
}
