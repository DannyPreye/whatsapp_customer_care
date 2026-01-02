import http from 'http';
import { createApp, restoreBaileysConnections } from './app';
import { config } from './config';
import { logger } from './logger';
import { connectMongo, disconnectMongo } from './db/mongo';
import { FollowUpWorker } from './services/workers/followup.worker';

async function main()
{
    await connectMongo();
    const app = createApp();
    const server = http.createServer(app);
    server.listen(config.env.PORT, () =>
    {
        logger.info(`Server listening on port ${config.env.PORT}`);
    });

    // Restore Baileys connections for organizations that were connected before restart
    await restoreBaileysConnections();

    // Start follow-up worker
    const followUpWorker = new FollowUpWorker();
    followUpWorker.start();

    const shutdown = async () =>
    {
        try {
            logger.info('Shutting down');
            followUpWorker.stop();
            await disconnectMongo();
            server.close(() =>
            {
                logger.info('Server closed');
                process.exit(0);
            });
        } catch (err) {
            logger.error('Shutdown error', { err });
            process.exit(1);
        }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

main().catch((err) =>
{
    logger.error('Fatal error', { err });
    process.exit(1);
});
