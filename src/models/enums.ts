export enum OrgUserRole
{
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    AGENT = 'AGENT',
    VIEWER = 'VIEWER'
}

export enum ConversationStatus
{
    ACTIVE = 'ACTIVE',
    WAITING_FOR_AGENT = 'WAITING_FOR_AGENT',
    WITH_AGENT = 'WITH_AGENT',
    RESOLVED = 'RESOLVED',
    ARCHIVED = 'ARCHIVED'
}

export enum Priority
{
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT'
}

export enum Direction
{
    INBOUND = 'INBOUND',
    OUTBOUND = 'OUTBOUND'
}

export enum MessageType
{
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    DOCUMENT = 'DOCUMENT',
    AUDIO = 'AUDIO',
    VIDEO = 'VIDEO',
    LOCATION = 'LOCATION',
    TEMPLATE = 'TEMPLATE'
}

export enum MessageStatus
{
    PENDING = 'PENDING',
    SENT = 'SENT',
    DELIVERED = 'DELIVERED',
    READ = 'READ',
    FAILED = 'FAILED'
}

export enum DocumentType
{
    PDF = 'PDF',
    IMAGE = 'IMAGE',
    TEXT = 'TEXT',
    DOCX = 'DOCX',
    EXCEL = 'EXCEL',
    CSV = 'CSV'
}

export enum ProcessStatus
{
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export enum HandoffStatus
{
    PENDING = 'PENDING',
    ASSIGNED = 'ASSIGNED',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    CANCELLED = 'CANCELLED'
}

export enum IntegrationType
{
    CALENDLY = 'calendly',
    STRIPE = 'stripe',
    SLACK = 'slack',
    CRM = 'crm',
    EMAIL = 'email',
    WEBHOOK = 'webhook',
    ZAPIER = 'zapier',
    CUSTOM = 'custom'
}

export enum NotificationType
{
    HANDOFF_REQUEST = 'HANDOFF_REQUEST',
    SYSTEM_ALERT = 'SYSTEM_ALERT',
    TRAINING_COMPLETE = 'TRAINING_COMPLETE',
    CONVERSATION_ASSIGNED = 'CONVERSATION_ASSIGNED',
    CUSTOMER_MESSAGE = 'CUSTOMER_MESSAGE'
}
