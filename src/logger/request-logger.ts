import expressWinston from 'express-winston';
import { logger } from './index';

export const requestLogger = expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: '{{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
    expressFormat: false,
    colorize: false,
    ignoreRoute: (req) => req.url.startsWith('/docs')
});
