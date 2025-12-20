import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

class CloudinaryService
{
    private configured = false;

    private ensureConfig()
    {
        if (this.configured) return;
        if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
            cloudinary.config({
                cloud_name: env.CLOUDINARY_CLOUD_NAME,
                api_key: env.CLOUDINARY_API_KEY,
                api_secret: env.CLOUDINARY_API_SECRET
            });
            this.configured = true;
        } else {
            throw new Error('Cloudinary env not set: CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET');
        }
    }

    async uploadBuffer(buffer: Buffer, filename?: string): Promise<{ url: string; public_id: string; bytes: number; format?: string; }>
    {
        this.ensureConfig();
        return new Promise((resolve, reject) =>
        {
            const stream = cloudinary.uploader.upload_stream({ filename_override: filename }, (error, result) =>
            {
                if (error || !result) return reject(error);
                resolve({ url: result.secure_url, public_id: result.public_id, bytes: result.bytes, format: result.format });
            });
            stream.end(buffer);
        });
    }
}

export const cloudinaryService = new CloudinaryService();
