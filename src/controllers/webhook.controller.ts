import { Request, Response } from 'express';
import { MessageModel } from '../models/message.model';
import { ConversationModel } from '../models/conversation.model';
import { Direction, MessageType, MessageStatus } from '../models/enums';
import { config } from '../config';

export function verifyWhatsApp(req: Request, res: Response)
{
    const mode = req.query[ 'hub.mode' ];
    const token = req.query[ 'hub.verify_token' ];
    const challenge = req.query[ 'hub.challenge' ];

    console.log('WhatsApp verification request', { mode, token, challenge });
    console.log('Expected token:', config.env.WHATSAPP_VERIFY_TOKEN);
    if (mode === 'subscribe' && token === config.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('WhatsApp verified successfully');
        return res.status(200).send(challenge as string);
    }
    return res.status(403).send('Forbidden');
}

export async function receiveWhatsApp(req: Request, res: Response)
{
    try {
        const body = req.body as any;
        if (body && body.entry) {
            for (const entry of body.entry) {
                const changes = entry.changes || [];
                for (const change of changes) {
                    const messages = change.value?.messages || [];
                    for (const msg of messages) {
                        const from = msg.from; // customer phone
                        const text = msg.text?.body || '';
                        const whatsappId = msg.id;

                        console.log('Received WhatsApp message', { from, text, whatsappId });

                        // Resolve conversation by metadata (simplified: find latest conversation by customerId)
                        const conv = await ConversationModel.findOne({ metadata: { from } }).lean();
                        let conversationId = conv?._id as string;
                        if (!conversationId) {
                            const created = await ConversationModel.create({
                                organizationId: process.env.DEFAULT_ORG_ID || 'org-default',
                                customerId: from,
                                status: 'ACTIVE',
                                priority: 'MEDIUM',
                                metadata: { from }
                            } as any);
                            const createdDoc = Array.isArray(created) ? (created as any)[ 0 ] : created;
                            conversationId = (createdDoc as any)._id as string;
                        }

                        await MessageModel.create({
                            conversationId,
                            whatsappId,
                            direction: Direction.INBOUND,
                            type: MessageType.TEXT,
                            content: text,
                            metadata: {},
                            status: MessageStatus.DELIVERED,
                            isFromAgent: false,
                            aiGenerated: false
                        } as any);
                    }
                }
            }
        }
        return res.status(200).send('EVENT_RECEIVED');
    } catch (e) {
        return res.status(500).send('ERROR');
    }
}
