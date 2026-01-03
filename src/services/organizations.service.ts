import { OrganizationModel, Organization, AgentSettings } from '../models/organization.model';
import { baileysManager } from './baileysManager.service';

export async function listOrganizations(): Promise<Organization[]>
{
    return OrganizationModel.find().limit(200).lean();
}

export async function createOrganization(input: Partial<Organization> & { name: string; ownerId: string; }): Promise<Organization>
{
    // Create default agent settings if not provided
    const defaultAgentSettings: AgentSettings = {
        systemPrompt: `You are an intelligent sales assistant for ${input.name}. Your mission is to help customers discover the right solutions while building trust and driving meaningful conversations.

Core Responsibilities:
- Understand customer needs through thoughtful questions
- Provide accurate information about products/services using available knowledge base
- Guide customers toward concrete next steps (demos, quotes, meetings, purchases)
- Build rapport while maintaining professionalism
- Qualify leads by understanding budget, timeline, and decision-making authority

Communication Guidelines:
- Be conversational yet professional - imagine you're the company's best salesperson
- Listen actively and acknowledge customer concerns
- Ask clarifying questions when needed
- Provide specific, actionable information
- Never make promises you can't keep or invent features
- If you don't know something, admit it and offer to find out

Sales Best Practices:
- Focus on value and benefits, not just features
- Address objections with empathy and facts
- Create urgency when appropriate, but never pressure
- Always end with a clear call-to-action or next step
- Track customer information to personalize future conversations

Remember: Your goal is to be helpful first, salesy second. Build relationships that lead to conversions.`,
        tone: 'friendly',
        maxReplyLength: 150,
        signature: `Best regards,\n${input.name} Team`,
        callToAction: 'Ready to get started? Let me know how I can help you today!',
        followUpEnabled: true,
        escalation: {
            enabled: false,
            rules: [
                'Customer explicitly asks to speak with a human',
                'Complex technical issue beyond AI capability',
                'High-value deal requiring manager approval',
                'Customer is frustrated or dissatisfied'
            ],
            phone: ''
        }
    };

    const org = new OrganizationModel({
        name: input.name,
        description: input.description,
        industry: input.industry,
        website: input.website,
        whatsappPhoneId: input.whatsappPhoneId,
        whatsappToken: input.whatsappToken,
        whatsappBusinessId: input.whatsappBusinessId,
        isActive: input.isActive,
        settings: input.settings,
        ownerId: input.ownerId,
        agentSettings: input.agentSettings || defaultAgentSettings
    } as any);
    return org.save();
}

export async function getOrganizationById(id: string): Promise<Organization | null>
{
    return OrganizationModel.findById(id).lean();
}

export async function updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | null>
{
    return OrganizationModel.findByIdAndUpdate(id, updates as any, { new: true }).lean();
}

export async function deleteOrganization(id: string): Promise<boolean>
{
    const res = await OrganizationModel.deleteOne({ _id: id }).exec();
    return res.deletedCount === 1;
}

export async function getSettings(id: string): Promise<Record<string, unknown> | null>
{
    const org = await OrganizationModel.findById(id, { settings: 1 }).lean();
    return org ? (org as any).settings || {} : null;
}

export async function updateSettings(id: string, settings: Record<string, unknown>): Promise<Record<string, unknown> | null>
{
    const org = await OrganizationModel.findByIdAndUpdate(id, { settings }, { new: true, projection: { settings: 1 } }).lean();
    return org ? (org as any).settings || {} : null;
}

export async function getAgentSettings(id: string): Promise<AgentSettings | null>
{
    const org = await OrganizationModel.findById(id, { agentSettings: 1 }).lean();
    return org ? (org as any).agentSettings || null : null;
}

export async function updateAgentSettings(id: string, agentSettings: AgentSettings): Promise<AgentSettings | null>
{
    const org = await OrganizationModel.findByIdAndUpdate(
        id,
        { agentSettings },
        { new: true, projection: { agentSettings: 1 } }
    ).lean();
    return org ? (org as any).agentSettings || null : null;
}


export async function connectWhatsApp(organizationId: string): Promise<void>
{
    const org = await OrganizationModel.findById(organizationId).lean();
    if (!org) {
        throw new Error('Organization not found');
    }

    const existingClient = baileysManager.getClient(organizationId);
    if (existingClient) {
        // Only throw error if client is actually connected
        if (existingClient.isReady) {
            throw new Error('WhatsApp client already connected for this organization');
        }
        // If client exists but is not ready, remove it to allow fresh connection
        console.log(`[OrgService] Removing disconnected client for org: ${organizationId}`);
        await baileysManager.removeClient(organizationId);
    }

    await baileysManager.createClient(organizationId);
}

export async function getQRCode(organizationId: string): Promise<string>
{
    const clientInfo = baileysManager.getClient(organizationId);
    if (!clientInfo) {
        throw new Error('WhatsApp client not found for this organization. Please initialize connection first.');
    }

    if (clientInfo.isReady) {
        throw new Error('WhatsApp client is already connected');
    }

    if (!clientInfo.qrCode) {
        throw new Error('QR code not available. Please wait a few seconds and try again.');
    }

    return clientInfo.qrCode;
}

export async function updateOrganizationWhatsAppStatus(
    organizationId: string,
    authType: 'oauth' | 'baileys',
    status: 'connected' | 'disconnected' | 'pending'
): Promise<Organization | null>
{
    return updateOrganization(organizationId, {
        whatsappAuthType: authType,
        whatsappConnectionStatus: status
    } as any);
}
