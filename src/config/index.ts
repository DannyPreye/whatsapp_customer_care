import { env, isProd } from './env';

export const config = {
    env,
    isProd
};

export type Config = typeof config;
