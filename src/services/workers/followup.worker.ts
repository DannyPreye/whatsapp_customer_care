import { CustomerModel } from '../../models/customer.model';
import { OrganizationModel } from '../../models/organization.model';
import { ConversationModel } from '../../models/conversation.model';
import { SalesAgent } from '../agents/salesAgenet.agent';
import { logger } from '../../logger';

export class FollowUpWorker
{
    private intervalId: NodeJS.Timeout | null = null;
    private salesAgent = new SalesAgent();

    start()
    {
        const enabled = process.env.FOLLOWUP_WORKER_ENABLED ?? 'true';
        if (enabled !== 'true') {
            logger.info('FollowUpWorker disabled by env');
            return;
        }
        const intervalMs = Number(process.env.FOLLOWUP_WORKER_INTERVAL_MS || 60000);
        this.intervalId = setInterval(() => this.runOnce().catch(err => logger.error('FollowUpWorker error', { err })), intervalMs);
        logger.info(`FollowUpWorker started, interval ${intervalMs}ms`);
    }

    stop()
    {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            logger.info('FollowUpWorker stopped');
        }
    }

    async runOnce()
    {
        const now = new Date();
        // Find customers due for follow-up, not blocked, and not already sent at/after scheduled time
        const customers = await CustomerModel.find({
            isBlocked: false,
            nextFollowUpAt: { $lte: now },
            $or: [
                { lastFollowUpSentAt: { $exists: false } },
                { $expr: { $lt: [ '$lastFollowUpSentAt', '$nextFollowUpAt' ] } }
            ]
        }).limit(50).lean();

        for (const c of customers as any[]) {
            try {
                const org = await OrganizationModel.findById(c.organizationId, { agentSettings: 1, name: 1 }).lean();
                if (org?.agentSettings?.followUpEnabled === false) {
                    logger.info('Follow-up disabled for org, skipping', { organizationId: c.organizationId });
                    continue;
                }

                if (!c.whatsappNumber) {
                    logger.warn('Skipping follow-up: missing whatsappNumber', { customerId: c._id });
                    continue;
                }

                // Find the conversation for this customer
                const conversation = await ConversationModel.findOne({
                    customerId: c._id,
                    organizationId: c.organizationId
                }).lean();

                if (!conversation) {
                    logger.warn('No conversation found for customer, skipping', { customerId: c._id });
                    continue;
                }

                // Prepare agent request with follow-up context
                const agentRequest = {
                    conversationId: (conversation as any)._id,
                    organization: c.organizationId,
                    customer: {
                        id: c._id,
                        name: c.name,
                        whatsappNumber: c.whatsappNumber,
                        lifecycleStage: c.lifecycleStage,
                        prospectScore: c.prospectScore
                    },
                    followUpContext: {
                        isScheduledFollowUp: true,
                        notes: c.followUpNotes,
                        scheduledAt: c.nextFollowUpAt
                    },
                    customerMessage: `[System] This is a scheduled follow-up. Review the previous conversation history and send an appropriate, personalized follow-up message to re-engage the customer. Use the follow-up notes if provided: ${c.followUpNotes || 'No specific notes'}. Be natural, reference previous discussions, and encourage next steps.`
                };

                // Let the AI agent handle the follow-up
                await this.salesAgent.handleRequest(JSON.stringify(agentRequest));

                // Mark as sent
                await CustomerModel.updateOne(
                    { _id: c._id },
                    {
                        $set: { lastFollowUpSentAt: new Date() },
                        $inc: { followUpSentCount: 1 },
                        $unset: { nextFollowUpAt: '' }
                    }
                );

                logger.info('Follow-up sent via agent', { customerId: c._id });
            } catch (err) {
                logger.error('Failed to send follow-up', { customerId: (c as any)._id, err });
            }
        }
    }
}
