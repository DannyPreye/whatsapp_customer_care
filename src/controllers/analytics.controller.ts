import { Request, Response } from 'express';
import { AnalyticsService, AnalyticsQuery } from '../services/analytics.service';
import { ok } from '../utils/response';

const service = new AnalyticsService();

function toQuery(req: Request): AnalyticsQuery
{
    const { organizationId, startDate, endDate } = req.query as { organizationId: string; startDate?: string; endDate?: string; };
    return {
        organizationId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
    };
}

export async function analyticsOverview(req: Request, res: Response)
{
    const data = await service.overview(toQuery(req));
    return ok(res, data);
}

export async function analyticsConversations(req: Request, res: Response)
{
    const data = await service.conversations(toQuery(req));
    return ok(res, data);
}

export async function analyticsPerformance(req: Request, res: Response)
{
    const data = await service.performance(toQuery(req));
    return ok(res, data);
}

export async function analyticsCSAT(req: Request, res: Response)
{
    const data = await service.customerSatisfaction(toQuery(req));
    return ok(res, data);
}

export async function analyticsAgentPerformance(req: Request, res: Response)
{
    const data = await service.agentPerformance(toQuery(req));
    return ok(res, data);
}

export async function analyticsExport(req: Request, res: Response)
{
    const csv = await service.exportCSV(toQuery(req));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics.csv"');
    return res.status(200).send(csv);
}
