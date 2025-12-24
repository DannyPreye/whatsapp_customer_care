
import { createAgent } from "langchain";
import { WhatsappToolService } from "./tools/whatsapp";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import * as orgService from "../organizations.service";
import { ChatOpenAI } from "@langchain/openai";
export class SalesAgent
{

    private whatsappToolService: WhatsappToolService;
    private basePrompt: string;

    constructor ()
    {

        this.whatsappToolService = new WhatsappToolService();
        this.basePrompt = `You are "sales-agent", a focused WhatsApp sales assistant.

Goals: understand intent, answer accurately using the knowledge base, and move the conversation to a clear next step (schedule, quote, or demo).

Rules:
- Never invent facts; use tools for context and product details.
- Safety: if asked for harmful, hateful, racist, sexist, lewd, or violent content, reply exactly: "Sorry, I can't assist with that."`;


    }

    private buildSystemPrompt(settings?: any)
    {
        const tone = settings?.tone || 'concise';
        const maxWords = settings?.maxReplyLength || 120;
        const custom = settings?.systemPrompt ? `Org prompt: ${settings.systemPrompt}` : '';
        const callToAction = settings?.callToAction ? `Call to action: ${settings.callToAction}` : '';
        const signature = settings?.signature ? `Signature: ${settings.signature}` : '';

        const escalation = settings?.escalation?.enabled
            ? `If escalation triggers match (${settings.escalation?.rules || 'organization-provided criteria'}), escalate to a human at ${settings.escalation?.phone || 'the provided escalation phone'}. Make escalation clear to the user.`
            : `Handle fully yourself unless safety requires refusal or the customer explicitly requests a human.`;

        return [
            this.basePrompt,
            `Tone: ${tone}.`,
            `Keep responses concise (<=${maxWords} words), professional, and helpful.`,
            'Use tools for recent context and knowledge base facts before answering.',
            `Always make sure to send a message that moves the sale forward`,
            "Always use the whatsapp tool to send messages, and always send back a response",
            custom,
            callToAction,
            escalation,
            signature
        ].filter(Boolean).join('\n');
    }

    private createAgent(systemPrompt: string)
    {
        console.log("Creating agent with system prompt:", systemPrompt);
        return createAgent({
            model: new ChatOpenAI({
                temperature: 0.7,
                model: "gpt-4o-mini",

            }),
            tools: [
                this.whatsappToolService.sendMessageTool(),
                this.whatsappToolService.fetchRecentMessagesTool(),
                this.whatsappToolService.getKnowledgeBaseTool(),
                this.whatsappToolService.getCustomerTool(),
                this.whatsappToolService.updateCustomerTool(),
                this.whatsappToolService.assessProspectTool(),
                this.whatsappToolService.scheduleFollowUpTool(),
                this.whatsappToolService.saveSentMessageTool()
            ],
            name: "sales-agent",
            description: "An AI agent that helps sales representatives engage with customers via WhatsApp messages.",
            systemPrompt,

        });
    }

    async handleRequest(input: string)
    {
        let parsed: any = input;
        try {
            parsed = JSON.parse(input);
        } catch (_err) {
            // keep as raw string if parsing fails
        }

        const organizationId = parsed?.organization || parsed?.organizationId;
        const agentSettings = organizationId ? await orgService.getAgentSettings(organizationId) : null;
        const systemPrompt = this.buildSystemPrompt(agentSettings || {});
        const agent = this.createAgent(systemPrompt);

        const response = await agent.invoke({
            messages: [ { role: "user", content: input } ]
        });

        console.log("This is the response", response.messages[ 0 ].content);

        return response.messages[ 0 ].content;
    }



}
