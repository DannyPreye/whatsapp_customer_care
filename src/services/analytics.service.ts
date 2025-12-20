import { ConversationMetricsModel } from '../models/conversation-metrics.model';

export class AnalyticsService
{
    async overview()
    {
        const agg = await ConversationMetricsModel.aggregate([
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

    async conversations()
    {
        return ConversationMetricsModel.find({}, { date: 1, totalConversations: 1, resolvedByAI: 1, handedOffToHuman: 1 })
            .sort({ date: 1 })
            .lean();
    }

    async performance()
    {
        return ConversationMetricsModel.find({}, { date: 1, averageResponseTime: 1, averageResolutionTime: 1 })
            .sort({ date: 1 })
            .lean();
    }

    async customerSatisfaction()
    {
        return ConversationMetricsModel.find({}, { date: 1, customerSatisfaction: 1 }).sort({ date: 1 }).lean();
    }

    async agentPerformance()
    {
        // Placeholder: without per-agent metrics, return overall performance
        return this.performance();
    }

    async exportCSV()
    {
        const rows = await ConversationMetricsModel.find().sort({ date: 1 }).lean();
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
