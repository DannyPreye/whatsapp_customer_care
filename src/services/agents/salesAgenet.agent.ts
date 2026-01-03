import { createAgent } from "langchain";
import { WhatsappToolService } from "./tools/whatsapp";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import * as orgService from "../organizations.service";
import { ChatOpenAI } from "@langchain/openai";
import { MessageModel } from "../../models/message.model";
import { CustomerModel } from "../../models/customer.model";
import { Direction } from "../../models/enums";

export class SalesAgent
{
    private whatsappToolService: WhatsappToolService;
    private basePrompt: string;

    constructor ()
    {
        this.whatsappToolService = new WhatsappToolService();
        this.basePrompt = `You are a real sales representative for this company, not an AI assistant. You communicate with customers via WhatsApp as part of your daily sales work.

Your personality and approach:
- You're a genuine person having real conversations with potential customers
- You're knowledgeable, enthusiastic about what you sell, but never pushy
- You build rapport naturally - ask questions, show interest, remember details from earlier in conversations
- You're responsive and attentive, like any good salesperson would be
- You have a natural sales instinct: listen, understand needs, position value, overcome objections, move forward

How you communicate:
- Text naturally like a real person on WhatsApp (casual but professional)
- Use the customer's name once you know it, but not excessively
- Show personality - use light humor when appropriate, show empathy, be relatable
- Keep messages conversational length (1-3 sentences typically, longer only when explaining something complex)
- Never use bullet points or formatted lists - nobody texts like that
- Use natural transitions and conversational phrases: "Actually...", "That reminds me...", "Speaking of which...", "I'm curious...", "Here's the thing..."
- React authentically to what customers say: show excitement when they're interested, concern when they have problems, understanding when they're hesitant

Sales approach:
- Remember everything discussed in the conversation - reference it naturally
- Ask qualifying questions conversationally (not like an interrogation)
- Share relevant product/service info from the knowledge base when it adds value
- Handle objections smoothly without being defensive
- Know when to soft-close: "Would it make sense to...", "How about we...", "What if I..."
- Be persistent but respectful - if they're not ready, find out why and when to follow up
- Always move toward a next step (call, demo, quote, meeting) but do it naturally

Critical rules:
- NEVER say you're an AI or assistant - you're a sales rep, period
- NEVER act robotic or formulaic - vary your language and approach
- NEVER repeat information you've already shared in this conversation
- NEVER restart conversations - always continue from where you left off
- Only use the knowledge base tool when you need to look up specific product details
- Update customer info (name, preferences, tags) as you learn about them
- If asked something harmful/inappropriate, politely deflect: "Let's keep this focused on how I can help with [product/service]"

Remember: You're not here to pass the Turing test - you're here to sell authentically as a human would.`;
    }

    private buildSystemPrompt(settings?: any, opts?: { transcript?: string; customerName?: string; customerInfo?: any; })
    {
        const tone = settings?.tone || 'friendly';
        const maxWords = settings?.maxReplyLength || 100;

        // Company context
        let companyContext = '';
        if (settings?.systemPrompt) {
            companyContext = `\n\n=== ABOUT OUR COMPANY ===\n${settings.systemPrompt}\n===================\n`;
        }

        // Conversation history - THE MOST IMPORTANT PART
        let conversationContext = '';
        if (opts?.transcript) {
            conversationContext = `\n\n=== YOUR CONVERSATION WITH THIS CUSTOMER ===
Here's your WhatsApp conversation so far (chronological order):

${opts.transcript}

=== END OF CONVERSATION HISTORY ===

CRITICAL: You are CONTINUING this exact conversation. The customer just replied to YOU. Everything above actually happened between you and this customer. You must:
- Remember what you've already told them (don't repeat yourself)
- Reference previous parts of the conversation naturally
- Respond in context of what you've discussed
- Continue your rapport and relationship
- Be consistent with your previous tone and promises

Read the history carefully before responding. Your next message should feel like the natural next text in this thread.`;
        } else {
            conversationContext = `\n\n=== NEW CONVERSATION ===\nThis is your first message with this customer. Make a great first impression.`;
        }

        // Customer context
        let customerContext = '';
        if (opts?.customerName) {
            customerContext = `\n\nCustomer name: ${opts.customerName}`;
            if (opts?.customerInfo) {
                const tags = opts.customerInfo.tags?.length > 0 ? `\nTags: ${opts.customerInfo.tags.join(', ')}` : '';
                const stage = opts.customerInfo.lifecycleStage ? `\nStage: ${opts.customerInfo.lifecycleStage}` : '';
                customerContext += tags + stage;
            }
        } else {
            customerContext = `\n\nYou don't know this customer's name yet. Find a natural moment to ask, but don't force it in the first message.`;
        }

        // Call to action / closing preferences
        const closingGuidance = settings?.callToAction
            ? `\n\nPreferred call-to-action approach: ${settings.callToAction}`
            : '';

        const signature = settings?.signature
            ? `\n\nSign your messages: ${settings.signature}`
            : '';

        // Escalation
        const escalationGuidance = settings?.escalation?.enabled
            ? `\n\nIf the customer explicitly asks for a manager/human or if you genuinely can't help: Let them know you'll connect them with your colleague/manager at ${settings.escalation?.phone || 'the team line'}. But handle everything you can yourself first - you're capable.`
            : '';

        // Style guidance
        const styleGuidance = `\n\n=== YOUR COMMUNICATION STYLE ===
Tone: ${tone}
Message length: Keep under ${maxWords} words (shorter is often better on WhatsApp)
Voice: Natural, conversational, authentically human
Format: Plain text, no bullet points, no numbered lists - just text like a real person

Examples of natural sales language:
- "Hey! Thanks for reaching out 😊"
- "That's a great question - here's what I'd suggest..."
- "I totally get that concern, actually a lot of our customers felt the same way before..."
- "Can I ask you something? What made you interested in [product] specifically?"
- "Honestly, I think [product] would be perfect for what you're describing"
- "Would it make sense to hop on a quick call this week? I can walk you through..."
===================`;

        return [
            this.basePrompt,
            companyContext,
            conversationContext,
            customerContext,
            styleGuidance,
            '\n\nMANDATORY REPLY RULES:\n- After ANY tool call (including knowledge base), you MUST send a concise WhatsApp reply via send_whatsapp_message. Never end without replying.\n- If knowledge base has no relevant info, acknowledge that, offer to find out, and ask a clarifying question.\n- Keep the reply human and contextual.\n- Do not repeat prior answers from the transcript.\n - Always use the save_sent_message tool after replying to save the message  you sent',
            '\n\nREQUIRED TOOL USAGE (MUST DO EVERY TIME):\n1. ALWAYS use update_customer tool if you learn ANY new information about the customer (name, preferences, interests, pain points, etc.)\n2. ALWAYS use assess_prospect tool after every customer interaction to update their lifecycle stage and score\n3. ALWAYS use save_sent_message tool to record your message after replying\n\nThese are NOT optional - you must call these tools in every conversation turn where applicable.',
            closingGuidance,
            escalationGuidance,
            // signature
        ].filter(Boolean).join('');
    }

    private createAgent(systemPrompt: string)
    {
        return createAgent({
            model: new ChatOpenAI({
                temperature: 0.9, // High creativity for natural human-like responses
                model: "gpt-4o", // Use the best model for most convincing human behavior
                topP: 0.95,
            }),
            tools: [
                this.whatsappToolService.sendMessageTool(),
                this.whatsappToolService.getKnowledgeBaseTool(),
                this.whatsappToolService.updateCustomerTool(),
                this.whatsappToolService.assessProspectTool(),
                this.whatsappToolService.scheduleFollowUpTool(),
                this.whatsappToolService.saveSentMessageTool()
            ],
            name: "sales-representative",
            description: "A human sales representative managing customer conversations via WhatsApp.",
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
        const conversationId = parsed?.conversationId || parsed?.conversation?.id;
        const customerId = parsed?.customerId || parsed?.customer?.id;
        const incomingMessage = parsed?.message || parsed?.content || input;

        const agentSettings = organizationId ? await orgService.getAgentSettings(organizationId) : null;

        // Build conversation transcript
        let transcript = '';
        let customerInfo: any = null;

        if (conversationId) {
            const messages = await MessageModel.find({ conversationId })
                .sort({ createdAt: -1 })
                .limit(20) // Last 20 messages for full context
                .lean();

            // Format as a real WhatsApp conversation
            transcript = messages
                .reverse() // Chronological order
                .map((m) =>
                {
                    const time = new Date(m.createdAt).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });

                    if (m.direction === Direction.INBOUND) {
                        return `[${time}] Customer: ${m.content}`;
                    } else {
                        return `[${time}] You: ${m.content}`;
                    }
                })
                .join('\n');
        }

        // Get customer details
        let customerName: string | undefined;
        if (organizationId && customerId) {
            customerInfo = await CustomerModel.findOne({ _id: customerId, organizationId }).lean();
            customerName = customerInfo?.name || undefined;

            // Background prospect assessment (non-blocking)
            this.assessProspectFromConversation(organizationId, customerId, conversationId)
                .catch(err => console.error('Background prospect assessment failed:', err));
        }

        const systemPrompt = this.buildSystemPrompt(agentSettings || {}, {
            transcript,
            customerName,
            customerInfo
        });

        const agent = this.createAgent(systemPrompt);

        // Frame the input naturally - the customer just texted you
        const response = await agent.invoke({
            messages: [ {
                role: "user",
                content: incomingMessage
            } ]
        });

        const agentReply = response.messages[ 0 ].content;
        console.log("Sales rep response:", response);

        // Extract text content from the response
        const replyText = typeof agentReply === 'string'
            ? agentReply
            : agentReply.map((block: any) => block.text || '').join('');


        return replyText;
    }

    private async assessProspectFromConversation(
        organizationId?: string,
        customerId?: string,
        conversationId?: string
    ): Promise<{ lifecycleStage?: string; prospectScore?: number; tags?: string[]; }>
    {
        if (!organizationId || !customerId || !conversationId) return {};

        const inbound = await MessageModel.find({ conversationId, direction: Direction.INBOUND })
            .sort({ createdAt: -1 })
            .limit(12)
            .lean();

        if (!inbound.length) return {};

        const text = inbound.map(m => m.content || '').join(' ').toLowerCase();

        // Enhanced keyword detection
        const buyingSignals = [ 'price', 'quote', 'buy', 'purchase', 'interested', 'cost', 'how much' ];
        const engagementSignals = [ 'demo', 'trial', 'call', 'meeting', 'schedule', 'available' ];
        const urgencySignals = [ 'today', 'now', 'asap', 'urgent', 'quickly', 'soon' ];

        let buyingHits = 0;
        let engagementHits = 0;
        let urgencyHits = 0;

        for (const k of buyingSignals) if (text.includes(k)) buyingHits++;
        for (const k of engagementSignals) if (text.includes(k)) engagementHits++;
        for (const k of urgencySignals) if (text.includes(k)) urgencyHits++;

        const totalSignals = buyingHits * 2 + engagementHits + urgencyHits; // Weight buying signals more
        let prospectScore = Math.min(1, totalSignals / 8);

        let lifecycleStage: 'unknown' | 'lead' | 'prospect' | 'customer' | 'churnRisk' = 'unknown';
        if (prospectScore >= 0.7) lifecycleStage = 'prospect';
        else if (prospectScore >= 0.4) lifecycleStage = 'lead';

        const tagSet = new Set<string>();
        if (lifecycleStage === 'prospect') tagSet.add('hot-lead');
        if (buyingHits > 0) tagSet.add('pricing-interest');
        if (engagementHits > 0) tagSet.add('wants-demo');
        if (urgencyHits > 0) tagSet.add('urgent');

        await CustomerModel.updateOne(
            { _id: customerId, organizationId },
            {
                $set: {
                    lifecycleStage,
                    prospectScore,
                    updatedAt: new Date()
                },
                ...(tagSet.size ? { $addToSet: { tags: { $each: Array.from(tagSet) } } } : {})
            }
        );

        return { lifecycleStage, prospectScore, tags: Array.from(tagSet) };
    }
}
