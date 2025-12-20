import http from 'http';
import { createApp } from './app';
import { config } from './config';
import { logger } from './logger';
import { connectMongo, disconnectMongo } from './db/mongo';

async function main()
{
    await connectMongo();
    const app = createApp();
    const server = http.createServer(app);
    server.listen(config.env.PORT, () =>
    {
        logger.info(`Server listening on port ${config.env.PORT}`);
    });

    const shutdown = async () =>
    {
        try {
            logger.info('Shutting down');
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
