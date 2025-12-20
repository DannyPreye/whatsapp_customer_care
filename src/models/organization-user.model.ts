import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { OrgUserRole } from './enums';

export interface OrganizationUser extends Document<string>
{
    _id: string;
    userId: string;
    organizationId: string;
    role: OrgUserRole;
    createdAt: Date;
}

const OrganizationUserSchema = new Schema<any>(
    {
        _id: { type: String, default: uuidv4 },
        userId: { type: String, required: true, ref: 'User' },
        organizationId: { type: String, required: true, ref: 'Organization' },
        role: { type: String, enum: Object.values(OrgUserRole), default: OrgUserRole.AGENT },
        createdAt: { type: Date, default: Date.now }
    },
    { versionKey: false }
);

OrganizationUserSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

OrganizationUserSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc, ret: any) =>
    {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
});

export const OrganizationUserModel = model<OrganizationUser>(
    'OrganizationUser',
    OrganizationUserSchema,
    'organization_users'
);
