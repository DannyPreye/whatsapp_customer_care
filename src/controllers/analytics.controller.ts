import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { ok } from '../utils/response';

const service = new AnalyticsService();

export async function analyticsOverview(_req: Request, res: Response)
{
    const data = await service.overview();
    return ok(res, data);
}

export async function analyticsConversations(_req: Request, res: Response)
{
    const data = await service.conversations();
    return ok(res, data);
}

export async function analyticsPerformance(_req: Request, res: Response)
{
    const data = await service.performance();
    return ok(res, data);
}

export async function analyticsCSAT(_req: Request, res: Response)
{
    const data = await service.customerSatisfaction();
    return ok(res, data);
}

export async function analyticsAgentPerformance(_req: Request, res: Response)
{
    const data = await service.agentPerformance();
    return ok(res, data);
}

export async function analyticsExport(_req: Request, res: Response)
{
    const csv = await service.exportCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics.csv"');
    return res.status(200).send(csv);
}
