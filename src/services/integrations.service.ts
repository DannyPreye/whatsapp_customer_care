import { IntegrationModel, Integration } from '../models/integration.model';
import { IntegrationFactory } from './integrations/integration.factory';

export class IntegrationsService
{
    async list(): Promise<Integration[]>
    {
        return IntegrationModel.find().lean();
    }

    async create(input: Partial<Integration>): Promise<Integration>
    {
        // Validate required fields
        if (!input.organizationId || !input.type || !input.name) {
            throw new Error('organizationId, type, and name are required');
        }

        // Validate config based on type
        this.validateConfig(input.type, input.config);

        const created = await IntegrationModel.create(input);
        return created.toJSON() as any;
    }

    async getById(id: string): Promise<Integration | null>
    {
        return IntegrationModel.findById(id).lean();
    }

    async update(id: string, input: Partial<Integration>): Promise<Integration | null>
    {
        // If type is being changed, validate new config
        if (input.type && input.config) {
            this.validateConfig(input.type, input.config);
        }

        return IntegrationModel.findByIdAndUpdate(id, input, { new: true }).lean();
    }

    async remove(id: string): Promise<boolean>
    {
        const res = await IntegrationModel.findByIdAndDelete(id);
        return !!res;
    }

    async test(id: string): Promise<{ success: boolean; message: string } | null>
    {
        const integ = await IntegrationModel.findById(id).lean();
        if (!integ) return null;

        try {
            const integrationService = IntegrationFactory.getIntegrationService(integ as any);
            const success = await integrationService.testConnection();

            // Update test status
            await IntegrationModel.findByIdAndUpdate(id, {
                lastTestedAt: new Date(),
                testStatus: success ? 'success' : 'failed'
            });

            return {
                success,
                message: success
                    ? `${integ.type} integration verified successfully`
                    : `${integ.type} integration test failed. Check your credentials.`
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                message: `Error testing ${integ.type} integration: ${errorMessage}`
            };
        }
    }

    /**
     * Get integrations by organization and optional type filter
     */
    async listByOrganization(organizationId: string, type?: string): Promise<Integration[]>
    {
        const query: any = { organizationId };
        if (type) query.type = type;
        return IntegrationModel.find(query).lean();
    }

    /**
     * Get active integration by organization and type
     */
    async getActiveByType(organizationId: string, type: string): Promise<Integration | null>
    {
        return IntegrationModel.findOne({
            organizationId,
            type,
            isActive: true
        }).lean();
    }

    /**
     * Validate config based on integration type
     */
    private validateConfig(type: string, config?: Record<string, unknown>): void
    {
        if (!config) {
            throw new Error(`Config is required for ${type}`);
        }

        const requiredFields: Record<string, string[]> = {
            'calendly': ['apiKey', 'calendarUrl'],
            'stripe': ['apiKey', 'publishableKey'],
            'slack': ['botToken', 'channelId'],
            'crm': ['apiKey'],
            'email': ['apiKey', 'sender'],
        };

        const required = requiredFields[type];
        if (!required) {
            // Allow unknown types but warn
            console.warn(`Unknown integration type: ${type}`);
            return;
        }

        for (const field of required) {
            if (!config[field]) {
                throw new Error(`Missing required field for ${type}: ${field}`);
            }
        }
    }
}
