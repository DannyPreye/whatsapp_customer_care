import { CustomerModel, Customer } from '../models/customer.model';
import { ConversationModel } from '../models/conversation.model';

export class CustomersService
{
    async listByOrganizations(orgIds: string[]): Promise<Customer[]>
    {
        if (!orgIds || orgIds.length === 0) return [];
        return CustomerModel.find({ organizationId: { $in: orgIds } }).lean();
    }

    async list(): Promise<Customer[]>
    {
        return CustomerModel.find().lean();
    }

    async create(input: Partial<Customer>): Promise<Customer>
    {
        const created = await CustomerModel.create(input);
        return created.toJSON() as any;
    }

    async getById(id: string): Promise<Customer | null>
    {
        return CustomerModel.findById(id).lean();
    }

    async getByIdForOrganizations(id: string, orgIds: string[]): Promise<Customer | null>
    {
        if (!orgIds || orgIds.length === 0) return null;
        return CustomerModel.findOne({ _id: id, organizationId: { $in: orgIds } }).lean();
    }

    async update(id: string, input: Partial<Customer>): Promise<Customer | null>
    {
        return CustomerModel.findByIdAndUpdate(id, input, { new: true }).lean();
    }

    async remove(id: string): Promise<boolean>
    {
        const res = await CustomerModel.findByIdAndDelete(id);
        return !!res;
    }

    async listConversations(
        customerId: string,
        opts?: {
            page?: number;
            limit?: number;
            status?: string;
            priority?: string;
            assignedToId?: string;
            startDate?: string | Date;
            endDate?: string | Date;
            sortBy?: 'lastMessageAt' | 'startedAt' | 'endedAt';
            order?: 'asc' | 'desc';
        }
    )
    {
        const page = Math.max(1, Number(opts?.page || 1));
        const limit = Math.min(100, Math.max(1, Number(opts?.limit || 20)));

        const query: any = { customerId };
        if (opts?.status) query.status = opts.status;
        if (opts?.priority) query.priority = opts.priority;
        if (opts?.assignedToId) query.assignedToId = opts.assignedToId;
        if (opts?.startDate || opts?.endDate) {
            query.lastMessageAt = {};
            if (opts.startDate) query.lastMessageAt.$gte = new Date(opts.startDate);
            if (opts.endDate) query.lastMessageAt.$lte = new Date(opts.endDate);
        }

        const sortField = opts?.sortBy || 'lastMessageAt';
        const sortOrder = (opts?.order || 'desc') === 'asc' ? 1 : -1;

        const [ items, total ] = await Promise.all([
            ConversationModel.find(query)
                .sort({ [ sortField ]: sortOrder })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            ConversationModel.countDocuments(query)
        ]);

        return { items, page, limit, total, pages: Math.ceil(total / limit) };
    }

    async block(id: string)
    {
        return CustomerModel.findByIdAndUpdate(id, { isBlocked: true }, { new: true }).lean();
    }

    async unblock(id: string)
    {
        return CustomerModel.findByIdAndUpdate(id, { isBlocked: false }, { new: true }).lean();
    }
}
