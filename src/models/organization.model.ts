import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type WhatsappAuthType = 'oauth' | 'baileys';
export type WhatsappConnectionStatus = 'connected' | 'disconnected' | 'pending';

export interface Organization extends Document<string>
{
    _id: string;
    name: string;
    description?: string;
    industry?: string;
    website?: string;
    whatsappPhoneId?: string;
    whatsappToken?: string;
    whatsappBusinessId?: string;
    whatsappAuthType?: WhatsappAuthType; // 'oauth' or 'baileys'
    whatsappConnectionStatus?: WhatsappConnectionStatus; // 'connected', 'disconnected', or 'pending'
    isActive: boolean;
    settings: Record<string, unknown>;
    agentSettings?: AgentSettings;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AgentEscalationSettings
{
    enabled: boolean;
    rules?: string[];
    phone?: string;
}

export interface AgentSettings
{
    // Personality
    agentName?: string;
    agentGender?: 'male' | 'female' | 'neutral';
    agentAge?: number;
    agentAvatar?: string; // URL to avatar image
    defaultLanguage?: string; // e.g., 'en', 'es', 'fr'

    // Communication
    systemPrompt?: string;
    tone?: 'concise' | 'friendly' | 'formal' | 'playful';
    maxReplyLength?: number; // words
    signature?: string;
    callToAction?: string;

    // Behavior
    escalation?: AgentEscalationSettings;
    followUpEnabled?: boolean;
}

const OrganizationSchema = new Schema<any>(
    {
        _id: { type: String, default: uuidv4 },
        name: { type: String, required: true },
        description: { type: String },
        industry: { type: String },
        website: { type: String },
        whatsappPhoneId: { type: String },
        whatsappToken: { type: String },
        whatsappBusinessId: { type: String },
        whatsappAuthType: { type: String, enum: [ 'oauth', 'baileys' ], default: 'oauth' },
        whatsappConnectionStatus: { type: String, enum: [ 'connected', 'disconnected', 'pending' ], default: 'disconnected' },
        isActive: { type: Boolean, default: true },
        settings: { type: Schema.Types.Mixed, default: {} },
        ownerId: { type: String, required: true, ref: 'User' },
        agentSettings: {
            type: {
                agentName: { type: String, trim: true },
                agentGender: { type: String, enum: [ 'male', 'female', 'neutral' ] },
                agentAge: { type: Number, min: 18, max: 100 },
                agentAvatar: { type: String },
                defaultLanguage: { type: String, default: 'en' },
                systemPrompt: { type: String, trim: true },
                tone: { type: String, enum: [ 'concise', 'friendly', 'formal', 'playful' ], default: 'concise' },
                maxReplyLength: { type: Number, default: 120 },
                signature: { type: String, trim: true },
                callToAction: { type: String, trim: true },
                followUpEnabled: { type: Boolean, default: true },
                escalation: {
                    type: {
                        enabled: { type: Boolean, default: false },
                        rules: { type: [ String ], default: [] },
                        phone: { type: String, trim: true }
                    },
                    default: { enabled: false }
                }
            },
            default: {
                tone: 'concise',
                maxReplyLength: 120,
                followUpEnabled: true,
                defaultLanguage: 'en',
                escalation: { enabled: false }
            }
        }
    },
    { timestamps: true }
);

OrganizationSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: any) =>
    {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    }
});

export const OrganizationModel = model<Organization>('Organization', OrganizationSchema, 'organizations');
