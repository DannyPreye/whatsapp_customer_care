import express from 'express';
import routes from './routes';
import { applySecurity } from './middlewares/security';
import { requestLogger } from './logger/request-logger';
import { notFoundHandler, errorHandler } from './middlewares/error-handler';
import { mountSwagger } from './docs/swagger';
import { baileysManager } from './services/baileysManager.service';
import { OrganizationModel } from './models/organization.model';

export function createApp()
{
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    applySecurity(app);
    app.use(requestLogger);
    mountSwagger(app);
    app.use('/api/v1', routes);
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

/**
 * Initialize Baileys connections for organizations that were connected before server restart
 * Call this after app starts and database is ready
 */
export async function restoreBaileysConnections(): Promise<void>
{
    try {
        console.log('[App] Restoring Baileys connections for previously connected organizations...');

        // Find all organizations with Baileys auth type and connected status
        const connectedOrganizations = await OrganizationModel.find({
            whatsappAuthType: 'baileys',
            whatsappConnectionStatus: 'connected'
        }).exec();

        console.log(`[App] Found ${connectedOrganizations.length} organizations with active Baileys connections`);

        // Restore each connection
        for (const org of connectedOrganizations) {
            try {
                console.log(`[App] Restoring Baileys connection for org: ${org._id}`);
                await baileysManager.createClient(org._id.toString());
            } catch (error) {
                console.error(`[App] Failed to restore Baileys connection for org ${org._id}:`, error);
                // Mark as disconnected since restoration failed
                await OrganizationModel.findByIdAndUpdate(
                    org._id,
                    { whatsappConnectionStatus: 'disconnected' },
                    { new: true }
                ).exec();
            }
        }

        console.log('[App] Baileys connection restoration complete');
    } catch (error) {
        console.error('[App] Error restoring Baileys connections:', error);
    }
}

