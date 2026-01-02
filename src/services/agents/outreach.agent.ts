import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { WhatsappToolService } from "./tools/whatsapp";
import { ConversationModel } from "../../models/conversation.model";

export interface OutreachInput
{
    organizationId: string;
    customerId: string;
    whatsappNumber: string;
    customerName?: string;
    messageHint?: string;
    conversationId?: string;
}

export class OutreachAgent
{
    private whatsappToolService = new WhatsappToolService();

    private buildSystemPrompt()
    {
        return [
            `You are "outreach-agent", an intelligent WhatsApp outreach assistant designed to initiate meaningful customer conversations.

## PRIMARY OBJECTIVE
Send a personalized first message to a new customer and establish engagement.

## EXECUTION WORKFLOW (MUST FOLLOW IN ORDER)

### Step 1: Context Gathering
- Call get_whatsapp_knowledge_base with topic="overview" and maxResults=3
- Extract key information: organization name, product/service value propositions, unique selling points
- If the call fails, acknowledge the limitation and proceed with available information

### Step 2: Message Crafting
Compose ONE opening message with these specifications:
- Length: 60-90 words (strict limit)
- Tone: Friendly, professional, conversational
- Structure:
  * Personalized greeting using customer's name (use name ONCE only)
  * Brief value proposition (what you offer)
  * Clear benefit (what's in it for them)
  * ONE specific call-to-action as a question
- Avoid: jargon, multiple questions, sales pressure, excessive punctuation

Example structure:
"Hi [Name]! I'm reaching out from [Company]. We help [specific benefit]. [One relevant detail about your solution]. Would you be interested in learning how we could [specific outcome for them]?"

### Step 3: Message Delivery
- Use send_whatsapp_message tool
- Parameters required:
  * phoneNumber: Use the EXACT number provided (no modifications)
  * message: Your crafted content
  * conversationId: As provided
- Verify send success before proceeding

### Step 4: Conversation Logging (CRITICAL - NON-NEGOTIABLE)
IMMEDIATELY after successful send, call save_sent_whatsapp_message with:
- conversationId: Must match the conversation
- content: Exact message text that was sent
- aiGenerated: true

⚠️ WARNING: Skipping this step will cause complete loss of conversation context. This is mandatory for every message.

## CONSTRAINTS & SAFETY

**Prohibited Actions:**
- Sending multiple messages in one interaction
- Skipping the save step under any circumstance
- Modifying or reformatting the phone number
- Making assumptions about customer preferences without data

**Content Safety:**
If requested to create harmful, hateful, violent, sexually explicit, or discriminatory content, respond with exactly:
"Sorry, I can't assist with that."

## ERROR HANDLING
- If knowledge base is unavailable: Use generic but professional messaging
- If send fails: Report the specific error and do not attempt save
- If save fails: Alert immediately and request manual intervention

## SUCCESS CRITERIA
✓ Knowledge base queried
✓ Message crafted within word limit
✓ Message sent successfully
✓ Message saved to conversation history
✓ Clear call-to-action delivered`
        ].join('\n');
    }

    private createAgent()
    {
        const systemPrompt = this.buildSystemPrompt();
        return createAgent({
            model: new ChatOpenAI({
                temperature: 0.35,
                model: "gpt-4o-mini"
            }),
            tools: [
                this.whatsappToolService.getKnowledgeBaseTool(),
                this.whatsappToolService.sendMessageTool(),
                this.whatsappToolService.saveSentMessageTool(),
                this.whatsappToolService.getCustomerTool()
            ],
            name: "outreach-agent",
            description: "AI agent that sends and saves the first outreach message to new customers using org knowledge base.",
            systemPrompt
        });
    }

    async handleOutreach(input: OutreachInput): Promise<{ success: boolean; message?: string; error?: string; }>
    {
        try {
            if (!input.organizationId || !input.customerId || !input.whatsappNumber) {
                return { success: false, error: 'organizationId, customerId, and whatsappNumber are required' };
            }

            // Create or find conversation
            let conversationId = input.conversationId;
            if (!conversationId) {
                let conv = await ConversationModel.findOne({
                    organizationId: input.organizationId,
                    customerId: input.customerId,
                    status: 'ACTIVE'
                }).lean();

                if (!conv) {
                    const created = await ConversationModel.create({
                        organizationId: input.organizationId,
                        customerId: input.customerId,
                        status: 'ACTIVE',
                        priority: 'MEDIUM',
                        metadata: { outreach: true, initiatedAt: new Date() }
                    });
                    conv = Array.isArray(created) ? created[ 0 ] : created;
                }
                conversationId = (conv as any)?._id?.toString();
            }

            if (!conversationId) {
                return { success: false, error: 'Failed to create or find conversation' };
            }

            const agent = this.createAgent();
            const payload = {
                organizationId: input.organizationId,
                customerId: input.customerId,
                whatsappNumber: input.whatsappNumber,
                conversationId,
                customerName: input.customerName || 'friend',
                messageHint: input.messageHint || ''
            };

            console.log(`[OutreachAgent] Starting outreach for customer ${input.customerId}`);
            const response = await agent.invoke({
                messages: [ { role: 'user', content: JSON.stringify(payload) } ]
            });

            const content = response.messages?.[ 0 ]?.content;
            console.log(`[OutreachAgent] Completed outreach. Response: ${content}`);

            return { success: true, message: String(content) };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`[OutreachAgent] Error:`, errorMsg);
            return { success: false, error: errorMsg };
        }
    }
}
