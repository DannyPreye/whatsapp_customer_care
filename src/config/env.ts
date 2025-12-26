import dotenv from 'dotenv';

dotenv.config();

export type AppEnv = {
    NODE_ENV: 'development' | 'test' | 'production';
    PORT: number;
    MONGO_URI: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    CORS_ORIGIN: string;
    LOG_LEVEL: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
    LOG_DIR: string;
    ACCESS_TOKEN_TTL: string; // e.g., '15m'
    REFRESH_TOKEN_TTL: string; // e.g., '7d'
    CLOUDINARY_CLOUD_NAME?: string;
    CLOUDINARY_API_KEY?: string;
    CLOUDINARY_API_SECRET?: string;
    WHATSAPP_VERIFY_TOKEN?: string;
    WHATSAPP_API_URL?: string;
    WHATSAPP_API_VERSION?: string;
    WHATSAPP_BUSINESS_ID?: string;
    WHATSAPP_PHONE_ID?: string;
    WHATSAPP_TOKEN?: string;
    PINECONE_API_KEY?: string;
    PINECONE_INDEX_NAME?: string;
    GOOGLE_API_KEY: string;
    FOLLOWUP_WORKER_ENABLED?: string; // 'true' | 'false'
    FOLLOWUP_WORKER_INTERVAL_MS?: string; // milliseconds,
    META_APP_ID?: string;
    META_APP_SECRET?: string;
    META_REDIRECT_URI?: string;
};

function getEnv(): AppEnv
{
    return {
        NODE_ENV: (process.env.NODE_ENV as AppEnv[ 'NODE_ENV' ]) || 'development',
        PORT: Number(process.env.PORT || 3000),
        MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp_manager',
        JWT_SECRET: process.env.JWT_SECRET || 'replace_me',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'replace_me',
        CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:8080',
        LOG_LEVEL: (process.env.LOG_LEVEL as AppEnv[ 'LOG_LEVEL' ]) || 'info',
        LOG_DIR: process.env.LOG_DIR || './logs',
        ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || '15m',
        REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL || '7d',
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
        WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN,
        WHATSAPP_API_URL: process.env.WHATSAPP_API_URL,
        WHATSAPP_API_VERSION: process.env.WHATSAPP_API_VERSION,
        WHATSAPP_BUSINESS_ID: process.env.WHATSAPP_BUSINESS_ID,
        WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID,
        WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
        PINECONE_API_KEY: process.env.PINECONE_API_KEY,
        PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME,
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
        META_APP_ID: process.env.META_APP_ID,
        META_APP_SECRET: process.env.META_APP_SECRET,
        META_REDIRECT_URI: process.env.META_REDIRECT_URI,
        FOLLOWUP_WORKER_ENABLED: process.env.FOLLOWUP_WORKER_ENABLED,
        FOLLOWUP_WORKER_INTERVAL_MS: process.env.FOLLOWUP_WORKER_INTERVAL_MS

    };
}

export const env = getEnv();
export const isProd = env.NODE_ENV === 'production';
