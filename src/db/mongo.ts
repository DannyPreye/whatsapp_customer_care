import mongoose from 'mongoose';
import { config } from '../config';
import { logger } from '../logger';

let isConnected = false;

export async function connectMongo(uri = config.env.MONGO_URI): Promise<void>
{
    if (isConnected) return;
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    isConnected = true;
    logger.info('MongoDB connected');
}

export async function disconnectMongo(): Promise<void>
{
    if (!isConnected) return;
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
}

export function mongoReady(): boolean
{
    return isConnected && mongoose.connection.readyState === 1;
}
