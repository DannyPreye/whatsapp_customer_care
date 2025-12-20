import { OrganizationModel, Organization } from '../models/organization.model';

export async function listOrganizations(): Promise<Organization[]>
{
    return OrganizationModel.find().limit(200).lean();
}

export async function createOrganization(input: Partial<Organization> & { name: string; }): Promise<Organization>
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
        settings: input.settings
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
