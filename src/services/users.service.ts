import { UserModel, User } from '../models/user.model';
import { UserRole } from '../models/user.model';
import { OrganizationModel, Organization } from '../models/organization.model';
import { OrganizationUserModel } from '../models/organization-user.model';
import { OrgUserRole } from '../models/enums';
import { hashPassword } from '../utils/password';

export type UserDependencies = {
    user: Omit<User, 'password'>;
    organizations: Array<{
        organization: Organization;
        role: OrgUserRole;
        relation: 'OWNER' | 'MEMBER';
    }>;
};

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

export async function getUserDependencies(userId: string): Promise<UserDependencies | null>
{
    const user = await UserModel.findById(userId).select('-password').lean<any>();
    if (!user) return null;

    const [ memberships, owned ] = await Promise.all([
        OrganizationUserModel.find({ userId }).lean<any>(),
        OrganizationModel.find({ ownerId: userId }).lean<any>()
    ]);

    const orgIds = new Set<string>();
    owned.forEach((org: any) => orgIds.add(org._id));
    memberships.forEach((membership: any) => orgIds.add(membership.organizationId));

    const organizations: Array<{ organization: Organization; role: OrgUserRole; relation: 'OWNER' | 'MEMBER'; }> = [];
    if (orgIds.size === 0) return { user, organizations };

    const orgDocs = await OrganizationModel.find({ _id: { $in: Array.from(orgIds) } }).lean<any>();
    const orgMap = new Map<string, Organization>(orgDocs.map((org: any) => [ org._id, org ]));
    const added = new Set<string>();

    owned.forEach((org: any) =>
    {
        const full = orgMap.get(org._id);
        if (!full || added.has(org._id)) return;
        organizations.push({ organization: full, role: OrgUserRole.OWNER, relation: 'OWNER' });
        added.add(org._id);
    });

    memberships.forEach((membership: any) =>
    {
        if (added.has(membership.organizationId)) return;
        const org = orgMap.get(membership.organizationId);
        if (!org) return;
        const role = membership.role || OrgUserRole.AGENT;
        organizations.push({ organization: org, role, relation: 'MEMBER' });
        added.add(membership.organizationId);
    });

    return { user, organizations };
}
