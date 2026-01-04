import axios from 'axios';
import { BaseIntegrationService } from './base.integration.service';
import { Integration } from '../../models/integration.model';

export class CalendlyIntegrationService extends BaseIntegrationService
{
    private baseUrl = 'https://api.calendly.com';

    constructor (integration: Integration)
    {
        super(integration);
    }

    async testConnection(): Promise<boolean>
    {
        try {
            const apiKey = this.integration.config?.apiKey;
            if (!apiKey) return false;

            await axios.get(`${this.baseUrl}/users/me`, {
                headers: { Authorization: `Bearer ${apiKey}` }
            });
            return true;
        } catch (error) {
            console.error('Calendly connection test failed:', error);
            return false;
        }
    }

    async getData(params: { type: string; }): Promise<any>
    {
        if (params.type === 'calendar_url') {
            return {
                url: this.integration.config?.calendarUrl,
                type: 'calendly'
            };
        }
        throw new Error(`Unknown Calendly data type: ${params.type}`);
    }

    getErrorMessage(): string
    {
        return "Calendly integration is not configured. Please connect Calendly in integrations settings.";
    }
}
