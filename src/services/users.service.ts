import { UserModel, User } from '../models/user.model';
import { UserRole } from '../models/user.model';
import { hashPassword } from '../utils/password';

export async function createUser(email: string, firstName: string, lastName: string, password: string): Promise<User>
{
    const user = new UserModel({ email, firstName, lastName, password });
    return user.save();
}

export async function getUserById(id: string): Promise<User | null>
{
    return UserModel.findById(id).exec();
}

export async function listUsers(): Promise<User[]>
{
    return UserModel.find().limit(100).exec();
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null>
{
    const data: any = { ...updates };
    if ((updates as any).password) {
        data.password = await hashPassword((updates as any).password);
    }
    return UserModel.findByIdAndUpdate(id, data, { new: true }).exec();
}

export async function deleteUser(id: string): Promise<boolean>
{
    const res = await UserModel.deleteOne({ _id: id }).exec();
    return res.deletedCount === 1;
}

export async function setUserRole(id: string, role: UserRole): Promise<User | null>
{
    return UserModel.findByIdAndUpdate(id, { role }, { new: true }).exec();
}
