import { Integration } from '../../models/integration.model';

export abstract class BaseIntegrationService
{
    protected integration: Integration;

    constructor (integration: Integration)
    {
        this.integration = integration;
    }

    /**
     * Test if the integration credentials are valid
     */
    abstract testConnection(): Promise<boolean>;

    /**
     * Get integration-specific data to use in tools
     */
    abstract getData(params: Record<string, any>): Promise<any>;

    /**
     * Get a friendly error message if something fails
     */
    abstract getErrorMessage(): string;
}
