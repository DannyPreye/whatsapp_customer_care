import { Integration } from '../../models/integration.model';
import { BaseIntegrationService } from './base.integration.service';
import { CalendlyIntegrationService } from './calendly.integration.service';

export class IntegrationFactory
{
    static getIntegrationService(integration: Integration): BaseIntegrationService
    {
        switch (integration.type) {
            case 'calendly':
                return new CalendlyIntegrationService(integration);
            // Add more integrations here as needed
            // case 'stripe':
            //     return new StripeIntegrationService(integration);
            // case 'slack':
            //     return new SlackIntegrationService(integration);
            default:
                throw new Error(`Unknown integration type: ${integration.type}`);
        }
    }
}
