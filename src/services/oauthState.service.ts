import { OAuthStateModel } from '../models/oauth-state.model';

export async function createState(state: string, organizationId: string)
{
    const doc = new OAuthStateModel({ state, organizationId });
    return doc.save();
}

export async function getState(state: string)
{
    return OAuthStateModel.findOne({ state }).select('+accessToken').lean();
}

export async function updateState(state: string, updates: Record<string, any>)
{
    return OAuthStateModel.findOneAndUpdate({ state }, updates, { new: true }).select('+accessToken').lean();
}

export async function deleteState(state: string)
{
    await OAuthStateModel.deleteOne({ state }).exec();
}

export async function deleteExpired(cutoffMs: number)
{
    const cutoff = new Date(Date.now() - cutoffMs);
    await OAuthStateModel.deleteMany({ createdAt: { $lt: cutoff } }).exec();
}
