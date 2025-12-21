import { Request, Response } from 'express';
import { MessageModel } from '../models/message.model';
import { ConversationModel } from '../models/conversation.model';
import { Direction, MessageType, MessageStatus } from '../models/enums';
import { config } from '../config';
import { OrganizationModel } from '../models/organization.model';
import { CustomerModel } from '../models/customer.model';
import { SalesAgent } from '../services/agents/salesAgenet.agent';

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

        // console.log("Received WhatsApp webhook", JSON.stringify(body));
        if (body && body.entry) {
            for (const entry of body.entry) {
                const changes = entry.changes || [];

                console.log("Received WhatsApp changes", JSON.stringify(changes));


                for (const change of changes) {

                    // console.log('Processing WhatsApp change', JSON.stringify(change.value));

                    const organizationPhoneId = change.value?.metadata?.phone_number_id;


                    // Fetch organization by whatsappPhoneId
                    const organization = await OrganizationModel.findOne({ whatsappPhoneId: organizationPhoneId }).lean();

                    const customerProfile = change.value?.contacts?.[ 0 ];


                    console.log("This is the customer profile:", customerProfile);


                    // Find customer by whatsapp id
                    let customer = await CustomerModel.findOne({ whatsappNumber: customerProfile?.wa_id, }).lean();


                    console.log("Found customer:", customer);


                    // if there's no customer, create one
                    if (!customer && customerProfile) {


                        const createdCustomer = await CustomerModel.create({
                            organizationId: organization?._id,
                            whatsappNumber: customerProfile.wa_id,

                            name: customerProfile.profile?.name || 'Unknown',

                        } as any);

                        customer = Array.isArray(createdCustomer) ? createdCustomer[ 0 ] : createdCustomer;


                    }
                    console.log("Resolved customer:", customer);
                    const messages = change.value?.messages || [];
                    for (const msg of messages) {
                        const from = msg.from; // customer phone
                        const text = msg.text?.body || '';
                        const whatsappId = msg.id;

                        // console.log('Received WhatsApp message', { from, text, whatsappId });

                        // Resolve conversation by metadata (simplified: find latest conversation by customerId)
                        const conv = await ConversationModel.findOne({ metadata: { from } }).lean();
                        let conversationId = conv?._id as string;
                        if (!conversationId) {
                            const created = await ConversationModel.create({
                                organizationId: process.env.DEFAULT_ORG_ID || 'org-default',
                                customerId: customer?._id,
                                status: 'ACTIVE',
                                priority: 'MEDIUM',
                                metadata: { from }
                            } as any);
                            const createdDoc = Array.isArray(created) ? (created as any)[ 0 ] : created;
                            conversationId = (createdDoc as any)._id as string;
                        }

                        console.log("Resolved conversation ID:", conversationId);

                        const formatMessagForAi = {
                            conversationId,
                            organization: organization?._id,
                            customer: {
                                id: customer?._id,
                                name: customer?.name,
                                whatsappNumber: customer?.whatsappNumber
                            },

                            customerMessage: text
                        };

                        const salesAgent = new SalesAgent();
                        console.log("Created sales agent instance");
                        res.on("finish", async () =>
                        {

                            // console.log("Handling sales agent request", JSON.stringify(formatMessagForAi));

                            try {
                                await salesAgent.handleRequest(JSON.stringify(formatMessagForAi));
                            } catch (error) {
                                console.error("Error handling sales agent request:", error);
                            }
                        });

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
