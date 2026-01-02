import { baileysManager } from './baileysManager.service';
import axios from "axios";
import { config } from "../config";
import { OrganizationModel } from '../models/organization.model';


export class WhatsAppService
{
    private apiUrl: string;
    private accessToken: string;
    private phoneNumberId: string;

    constructor ()
    {
        this.accessToken = config.env.WHATSAPP_TOKEN!;
        this.phoneNumberId = config.env.WHATSAPP_PHONE_ID!;
        this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
    }

    /**
     * Send message via appropriate method (OAuth or Baileys) based on organization settings
     */
    async sendMessage(to: string, message: string, organizationId?: string)
    {
        try {
            // If organizationId is provided, check auth type
            if (organizationId) {
                const org = await OrganizationModel.findById(organizationId).lean();
                if (org && (org as any).whatsappAuthType === 'baileys') {
                    // Use Baileys to send
                    console.log(`Sending message via Baileys for org: ${organizationId}`);
                    await baileysManager.sendMessage(organizationId, to, message);
                    return { success: true, method: 'baileys' };
                }
            }

            // Default: Use OAuth/Graph API
            console.log(`Sending message via OAuth for to: ${to}`);
            const response = await axios.post(
                this.apiUrl,
                {
                    messaging_product: "whatsapp",
                    to: to,
                    type: "text",
                    text: { body: message }
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        "Content-Type": "application/json"
                    }
                }
            );
            return response.data;
        } catch (error) {
            // @ts-ignore
            // console.error("Error sending WhatsApp message:", error?.response?.data || error.message);
            throw error;
        }
    }

    async sendTemplate(to: string, templateName: string, language: string = "en")
    {
        try {
            const response = await axios.post(
                this.apiUrl,
                {
                    messaging_product: "whatsapp",
                    to: to,
                    type: "template",
                    template: {
                        name: templateName,
                        language: { code: language }
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        "Content-Type": "application/json"
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error("Error sending template:", error);
            throw error;
        }
    }

    async markAsRead(messageId: string)
    {
        try {
            await axios.post(
                this.apiUrl,
                {
                    messaging_product: "whatsapp",
                    status: "read",
                    message_id: messageId
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        "Content-Type": "application/json"
                    }
                }
            );
        } catch (error) {
            console.error("Error marking message as read:", error);
        }
    }
}
