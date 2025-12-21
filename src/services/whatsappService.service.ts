import axios from "axios";
import { config } from "../config";

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

    async sendMessage(to: string, message: string,)
    {
        try {
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
            console.error("Error sending WhatsApp message:", error?.response?.data || error.message);
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
