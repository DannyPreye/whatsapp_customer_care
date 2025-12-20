import fs from 'fs';
import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config';

const logDir = config.env.LOG_DIR;
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const formatter = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const transports: winston.transport[] = [
    new winston.transports.Console({
        level: config.env.LOG_LEVEL,
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ level, message, timestamp, stack, ...meta }) =>
            {
                const base = `${timestamp} ${level}: ${message}`;
                const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                return stack ? `${base}\n${stack}${metaStr}` : `${base}${metaStr}`;
            })
        )
    }),
    new DailyRotateFile({
        dirname: logDir,
        filename: 'app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '14d',
        level: config.env.LOG_LEVEL
    }),
    new DailyRotateFile({
        dirname: logDir,
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '30d',
        level: 'error'
    })
];

export const logger = winston.createLogger({
    level: config.env.LOG_LEVEL,
    format: formatter,
    transports
});
