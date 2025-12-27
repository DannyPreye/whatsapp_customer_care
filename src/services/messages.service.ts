import { MessageModel } from '../models/message.model';

export class MessagesService
{
    async listForConversation(
        conversationId: string,
        opts?: {
            page?: number;
            limit?: number;
            q?: string;
            direction?: string;
            type?: string;
            status?: string;
            startDate?: string | Date;
            endDate?: string | Date;
            sortBy?: 'createdAt' | 'deliveredAt' | 'readAt';
            order?: 'asc' | 'desc';
        }
    )
    {
        const page = Math.max(1, Number(opts?.page || 1));
        const limit = Math.min(200, Math.max(1, Number(opts?.limit || 50)));

        const query: any = { conversationId };
        if (opts?.direction) query.direction = opts.direction;
        if (opts?.type) query.type = opts.type;
        if (opts?.status) query.status = opts.status;
        if (opts?.q) query.content = { $regex: String(opts.q), $options: 'i' };
        if (opts?.startDate || opts?.endDate) {
            query.createdAt = {};
            if (opts.startDate) query.createdAt.$gte = new Date(opts.startDate);
            if (opts.endDate) query.createdAt.$lte = new Date(opts.endDate);
        }

        const sortField = opts?.sortBy || 'createdAt';
        const sortOrder = (opts?.order || 'asc') === 'asc' ? 1 : -1;

        const [ items, total ] = await Promise.all([
            MessageModel.find(query)
                .sort({ [ sortField ]: sortOrder })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            MessageModel.countDocuments(query)
        ]);

        return { items, page, limit, total, pages: Math.ceil(total / limit) };
    }
}
