import { ConversationMetricsModel } from '../models/conversation-metrics.model';

export interface AnalyticsQuery
{
    organizationId: string;
    startDate?: Date;
    endDate?: Date;
}

function buildDateMatch(query: AnalyticsQuery)
{
    const date: Record<string, Date> = {};
    if (query.startDate) date.$gte = query.startDate;
    if (query.endDate) date.$lte = query.endDate;
    return Object.keys(date).length ? date : undefined;
}

export class AnalyticsService
{
    async overview(query: AnalyticsQuery)
    {
        const match: any = { organizationId: query.organizationId };
        const date = buildDateMatch(query);
        if (date) match.date = date;

        const agg = await ConversationMetricsModel.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalConversations: { $sum: '$totalConversations' },
                    resolvedByAI: { $sum: '$resolvedByAI' },
                    handedOffToHuman: { $sum: '$handedOffToHuman' },
                    avgResponse: { $avg: '$averageResponseTime' },
                    avgResolution: { $avg: '$averageResolutionTime' },
                    avgCSAT: { $avg: '$customerSatisfaction' }
                }
            }
        ]);
        return agg[ 0 ] || {};
    }

    async conversations(query: AnalyticsQuery)
    {
        const match: any = { organizationId: query.organizationId };
        const date = buildDateMatch(query);
        if (date) match.date = date;

        return ConversationMetricsModel.find(match, { date: 1, totalConversations: 1, resolvedByAI: 1, handedOffToHuman: 1 })
            .sort({ date: 1 })
            .lean();
    }

    async performance(query: AnalyticsQuery)
    {
        const match: any = { organizationId: query.organizationId };
        const date = buildDateMatch(query);
        if (date) match.date = date;

        return ConversationMetricsModel.find(match, { date: 1, averageResponseTime: 1, averageResolutionTime: 1 })
            .sort({ date: 1 })
            .lean();
    }

    async customerSatisfaction(query: AnalyticsQuery)
    {
        const match: any = { organizationId: query.organizationId };
        const date = buildDateMatch(query);
        if (date) match.date = date;

        return ConversationMetricsModel.find(match, { date: 1, customerSatisfaction: 1 }).sort({ date: 1 }).lean();
    }

    async agentPerformance(query: AnalyticsQuery)
    {
        // Placeholder: without per-agent metrics, reuse performance filtered by organization/date
        return this.performance(query);
    }

    async exportCSV(query: AnalyticsQuery)
    {
        const match: any = { organizationId: query.organizationId };
        const date = buildDateMatch(query);
        if (date) match.date = date;

        const rows = await ConversationMetricsModel.find(match).sort({ date: 1 }).lean();
        const header = [
            'date',
            'totalConversations',
            'resolvedByAI',
            'handedOffToHuman',
            'averageResponseTime',
            'averageResolutionTime',
            'customerSatisfaction'
        ];
        const csv = [ header.join(',') ]
            .concat(
                rows.map(
                    (r: any) =>
                        `${new Date(r.date).toISOString()},${r.totalConversations || 0},${r.resolvedByAI || 0},${r.handedOffToHuman || 0},${r.averageResponseTime || ''},${r.averageResolutionTime || ''},${r.customerSatisfaction || ''}`
                )
            )
            .join('\n');
        return csv;
    }
}
