
import { createAgent, tool } from "langchain";
import { WhatsappToolService } from "./tools/whatsapp";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import * as z from "zod";
export class SalesAgent
{

    private whatsappToolService: WhatsappToolService;
    private agent: ReturnType<typeof createAgent>;

    constructor ()
    {

        this.whatsappToolService = new WhatsappToolService();
        this.agent = createAgent({
            model: new ChatGoogleGenerativeAI({
                temperature: 0.7,
                model: "gemini-2.5-pro",

            }),
            tools: [ this.whatsappToolService.sendMessageTool(), this.whatsappToolService.fetchRecentMessagesTool(), this.whatsappToolService.getKnowledgeBaseTool() ],
            name: "sales-agent",
            description: "An AI agent that helps sales representatives engage with customers via WhatsApp messages.",
            systemPrompt: `You are \"sales-agent\", a focused WhatsApp sales assistant.

Goals: understand intent, answer accurately using the knowledge base, and move the conversation to a clear next step (schedule, quote, or demo).

Rules:
- Be concise (\<=120 words), professional, and helpful.
- Never invent facts; use tools for context and product details.
- Safety: if asked for harmful, hateful, racist, sexist, lewd, or violent content, reply exactly: "Sorry, I can't assist with that."

Tool policy:
1) Call fetchRecentMessagesTool to read recent context before replying.
2) Call getKnowledgeBaseTool when product/service facts are needed.
3) Use sendMessageTool to deliver the final reply to the customer.

Style:
- Greet by name if available; simple language; max one emoji.
- Provide a clear call-to-action (e.g., propose a time, confirm a plan, or offer a quote).
- Avoid links unless necessary; keep formatting plain text.

Output: Produce the message content intended for the customer and use tools as required to send it.`,

        });


    }

    async handleRequest(input: string)
    {
        return this.agent.invoke({
            messages: [ { role: "user", content: input } ]
        });
    }



}
