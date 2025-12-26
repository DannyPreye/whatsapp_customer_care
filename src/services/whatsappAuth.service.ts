import axios from "axios";
import { config } from "../config";

export interface FacebookAuthResponse
{
    access_token: string;
    token_type: string;
    expires_in: number;
}

export interface WhatsAppBusinessAccount
{
    id: string;
    name: string;
    timezone_id: string;
}

export interface PhoneNumber
{
    id: string;
    display_phone_number: string;
    verified_name: string;
    quality_rating: string;
}
export class WhatsappAuthService
{
    private readonly baseUrl = "https://www.facebook.com/v21.0";


    /**
   * Generate Facebook OAuth URL for user to authorize
   */
    getAuthorizationUrl(state: string): string
    {
        const scopes = [
            'business_management',
            'whatsapp_business_messaging',
            'business_management'
        ].join(',');

        const params = new URLSearchParams({
            client_id: config.env.META_APP_ID!,
            redirect_uri: config.env.META_REDIRECT_URI!,
            state: state,
            scope: scopes,
            response_type: 'code'
        });

        return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
    }


    /**
   * Exchange authorization code for access token
   */
    async exchangeCodeForToken(code: string): Promise<FacebookAuthResponse>
    {
        try {
            const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
                params: {
                    client_id: config.env.META_APP_ID!,
                    client_secret: config.env.META_APP_SECRET!,
                    redirect_uri: config.env.META_REDIRECT_URI!,
                    code: code
                }
            });

            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to exchange code: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    /**
 * Get long-lived access token (60 days)
 */
    async getLongLivedToken(shortLivedToken: string): Promise<FacebookAuthResponse>
    {
        try {
            const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: config.env.META_APP_ID!,
                    client_secret: config.env.META_APP_SECRET!,
                    fb_exchange_token: shortLivedToken
                }
            });

            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get long-lived token: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    /**
   * Get WhatsApp Business Accounts associated with the token
   */
    async getWhatsAppBusinessAccounts(accessToken: string): Promise<WhatsAppBusinessAccount[]>
    {
        try {
            const response = await axios.get(`${this.baseUrl}/me/businesses`, {
                params: {
                    access_token: accessToken,
                    fields: 'id,name,timezone_id'
                }
            });

            // Get WhatsApp Business Accounts from the business
            const businesses = response.data.data || [];
            const whatsappAccounts: WhatsAppBusinessAccount[] = [];

            for (const business of businesses) {
                const wabaResponse = await axios.get(
                    `${this.baseUrl}/${business.id}/owned_whatsapp_business_accounts`,
                    {
                        params: {
                            access_token: accessToken,
                            fields: 'id,name,timezone_id'
                        }
                    }
                );

                whatsappAccounts.push(...(wabaResponse.data.data || []));
            }

            return whatsappAccounts;
        } catch (error: any) {
            throw new Error(`Failed to get WhatsApp Business Accounts: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    /**
   * Get phone numbers associated with WhatsApp Business Account
   */
    async getPhoneNumbers(wabaId: string, accessToken: string): Promise<PhoneNumber[]>
    {
        try {
            const response = await axios.get(
                `${this.baseUrl}/${wabaId}/phone_numbers`,
                {
                    params: {
                        access_token: accessToken,
                        fields: 'id,display_phone_number,verified_name,quality_rating'
                    }
                }
            );

            return response.data.data || [];
        } catch (error: any) {
            throw new Error(`Failed to get phone numbers: ${error.response?.data?.error?.message || error.message}`);
        }
    }

}
