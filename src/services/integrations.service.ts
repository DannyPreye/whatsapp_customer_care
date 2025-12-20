import { IntegrationModel, Integration } from '../models/integration.model';

export class IntegrationsService
{
    async list(): Promise<Integration[]>
    {
        return IntegrationModel.find().lean();
    }
    async create(input: Partial<Integration>): Promise<Integration>
    {
        const created = await IntegrationModel.create(input);
        return created.toJSON() as any;
    }
    async getById(id: string): Promise<Integration | null>
    {
        return IntegrationModel.findById(id).lean();
    }
    async update(id: string, input: Partial<Integration>): Promise<Integration | null>
    {
        return IntegrationModel.findByIdAndUpdate(id, input, { new: true }).lean();
    }
    async remove(id: string): Promise<boolean>
    {
        const res = await IntegrationModel.findByIdAndDelete(id);
        return !!res;
    }
    async test(id: string): Promise<{ success: boolean; } | null>
    {
        const integ = await IntegrationModel.findById(id).lean();
        if (!integ) return null;
        // Placeholder: attempt to "ping" via config if applicable
        return { success: true };
    }
}
