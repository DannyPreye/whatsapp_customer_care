import { OrganizationModel, Organization, AgentSettings } from '../models/organization.model';
import { baileysManager } from './baileysManager.service';

export async function listOrganizations(): Promise<Organization[]>
{
    return OrganizationModel.find().limit(200).lean();
}

export async function createOrganization(input: Partial<Organization> & { name: string; ownerId: string; }): Promise<Organization>
{
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
        agentSettings: input.agentSettings
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
        throw new Error('WhatsApp client already connected for this organization');
    }

    await baileysManager.createClient(organizationId);
}

export async function getQRCode(organizationId: string): Promise<string>
{
    const clientInfo = baileysManager.getClient(organizationId);
    if (!clientInfo) {
        throw new Error('WhatsApp client not found for this organization');
    }

    if (!clientInfo.qrCode) {
        throw new Error('QR code not available');
    }

    if (clientInfo.isReady) {
        throw new Error('WhatsApp client is already connected');
    }

    if (!clientInfo.qrCode) {
        throw new Error('QR code not available');
    }


    return clientInfo.qrCode;
}
