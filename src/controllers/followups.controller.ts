import { Request, Response } from 'express';
import { CustomerModel } from '../models/customer.model';
import { ok } from '../utils/response';

export async function listPending(req: Request, res: Response)
{
    const { organizationId, limit } = req.query as any;
    const now = new Date();
    const q: any = { nextFollowUpAt: { $lte: now }, isBlocked: false };
    if (organizationId) q.organizationId = organizationId;
    const n = Math.min(Number(limit || 50), 200);
    const rows = await CustomerModel.find(q).limit(n).sort({ nextFollowUpAt: 1 }).lean();
    ok(res, rows.map(r => ({
        id: (r as any)._id,
        organizationId: r.organizationId,
        whatsappNumber: r.whatsappNumber,
        name: r.name,
        nextFollowUpAt: r.nextFollowUpAt,
        followUpNotes: r.followUpNotes,
        followUpSentCount: r.followUpSentCount,
        lastFollowUpSentAt: r.lastFollowUpSentAt
    })));
}

export async function listSent(req: Request, res: Response)
{
    const { organizationId, days, limit } = req.query as any;
    const lookbackDays = Math.min(Number(days || 30), 365);
    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
    const q: any = { lastFollowUpSentAt: { $gte: since } };
    if (organizationId) q.organizationId = organizationId;
    const n = Math.min(Number(limit || 50), 200);
    const rows = await CustomerModel.find(q).limit(n).sort({ lastFollowUpSentAt: -1 }).lean();
    ok(res, rows.map(r => ({
        id: (r as any)._id,
        organizationId: r.organizationId,
        whatsappNumber: r.whatsappNumber,
        name: r.name,
        lastFollowUpSentAt: r.lastFollowUpSentAt,
        followUpSentCount: r.followUpSentCount
    })));
}
