import express from 'express';
import routes from './routes';
import { applySecurity } from './middlewares/security';
import { requestLogger } from './logger/request-logger';
import { notFoundHandler, errorHandler } from './middlewares/error-handler';
import { mountSwagger } from './docs/swagger';

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
