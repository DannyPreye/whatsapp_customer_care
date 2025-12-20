import { CustomerModel, Customer } from '../models/customer.model';
import { ConversationModel } from '../models/conversation.model';

export class CustomersService
{
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

    async update(id: string, input: Partial<Customer>): Promise<Customer | null>
    {
        return CustomerModel.findByIdAndUpdate(id, input, { new: true }).lean();
    }

    async remove(id: string): Promise<boolean>
    {
        const res = await CustomerModel.findByIdAndDelete(id);
        return !!res;
    }

    async listConversations(id: string)
    {
        return ConversationModel.find({ customerId: id }).lean();
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
