import { Request, Response } from 'express';
import { MessagesService } from '../services/messages.service';
import { ConversationModel } from '../models/conversation.model';
import { getUserDependencies } from '../services/users.service';
import { ok } from '../utils/response';

const messagesService = new MessagesService();

async function getOrgContext(req: Request): Promise<{ accessibleOrgIds: Set<string>; }>
{
    const user = (req as any).user as { sub: string; } | undefined;
    if (!user || !user.sub) throw new Error('Unauthorized');
    const deps = await getUserDependencies(user.sub);
    const accessibleOrgIds = new Set<string>();
    if (deps?.organizations) {
        for (const o of deps.organizations) accessibleOrgIds.add(o.organization._id);
    }
    return { accessibleOrgIds };
}

export async function getConversationMessages(req: Request, res: Response)
{
    try {
        const { accessibleOrgIds } = await getOrgContext(req);

        console.log({ accessibleOrgIds });
        console.log(req.params.id);
        const convo = await ConversationModel.findById(req.params.id).lean<any>();


        if (!convo) return res.status(404).json({ error: 'Not found' });
        // if (!accessibleOrgIds.has(convo.organizationId)) return res.status(403).json({ error: 'Forbidden' });

        const { page, limit, q, direction, type, status, startDate, endDate, sortBy, order } = req.query as any;
        const data = await messagesService.listForConversation(req.params.id, {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            q,
            direction,
            type,
            status,
            startDate,
            endDate,
            sortBy,
            order
        });
        return ok(res, data);
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}
