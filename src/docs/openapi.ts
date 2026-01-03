import swaggerJSDoc from 'swagger-jsdoc';
import { OpenAPIV3 } from 'openapi-types';

const definition: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: {
        title: 'WhatsApp Manager API',
        version: '1.0.0',
        description: 'Production-ready API for WhatsApp Manager'
    },
    servers: [ { url: 'http://localhost:3000' } ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        },
        schemas: {
            ApiEnvelope: {
                type: 'object',
                properties: { data: { description: 'Response payload' } }
            },
            UserRole: { type: 'string', enum: [ 'SUPER_ADMIN', 'ADMIN', 'AGENT', 'VIEWER' ] },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    role: { $ref: '#/components/schemas/UserRole' },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                },
                required: [ 'id', 'email', 'firstName', 'lastName', 'role', 'isActive' ]
            },
            Organization: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    industry: { type: 'string', nullable: true },
                    website: { type: 'string', nullable: true },
                    whatsappPhoneId: { type: 'string', nullable: true },
                    whatsappToken: { type: 'string', nullable: true },
                    whatsappBusinessId: { type: 'string', nullable: true },
                    whatsappAuthType: { type: 'string', enum: [ 'oauth', 'baileys' ], nullable: true, description: 'Authentication method used: oauth or baileys' },
                    whatsappConnectionStatus: { type: 'string', enum: [ 'connected', 'disconnected', 'pending' ], nullable: true, description: 'Current WhatsApp connection status' },
                    isActive: { type: 'boolean' },
                    ownerId: { type: 'string' },
                    settings: { type: 'object', additionalProperties: true },
                    agentSettings: { $ref: '#/components/schemas/AgentSettings' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                },
                required: [ 'id', 'name', 'isActive', 'ownerId' ]
            },
            AgentEscalationSettings: {
                type: 'object',
                properties: {
                    enabled: { type: 'boolean' },
                    rules: { type: 'array', items: { type: 'string' } },
                    phone: { type: 'string', nullable: true }
                },
                required: [ 'enabled' ]
            },
            AgentSettings: {
                type: 'object',
                properties: {
                    systemPrompt: { type: 'string' },
                    tone: { type: 'string', enum: [ 'concise', 'friendly', 'formal', 'playful' ] },
                    maxReplyLength: { type: 'number' },
                    signature: { type: 'string' },
                    callToAction: { type: 'string' },
                    followUpEnabled: { type: 'boolean' },
                    escalation: { $ref: '#/components/schemas/AgentEscalationSettings' }
                }
            },
            Tokens: {
                type: 'object',
                properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' }
                },
                required: [ 'accessToken', 'refreshToken' ]
            },
            AuthRegisterInput: {
                type: 'object',
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' }
                },
                required: [ 'email', 'password', 'firstName', 'lastName' ]
            },
            AuthLoginInput: {
                type: 'object',
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 }
                },
                required: [ 'email', 'password' ]
            },
            RefreshInput: {
                type: 'object',
                properties: { refreshToken: { type: 'string' } },
                required: [ 'refreshToken' ]
            },
            ForgotPasswordInput: {
                type: 'object',
                properties: { email: { type: 'string', format: 'email' } },
                required: [ 'email' ]
            },
            ResetPasswordInput: {
                type: 'object',
                properties: { token: { type: 'string' }, password: { type: 'string', minLength: 6 } },
                required: [ 'token', 'password' ]
            },
            CreateOrganizationInput: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Organization name' },
                    ownerId: { type: 'string', description: 'User ID of the organization owner' },
                    description: { type: 'string', description: 'Optional organization description' },
                    industry: { type: 'string', description: 'Optional industry type' },
                    isActive: { type: 'boolean', description: 'Organization status', default: true }
                },
                required: [ 'name', 'ownerId' ]
            },
            UpdateOrganizationInput: {
                type: 'object',
                description: 'All fields optional for partial updates',
                properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    industry: { type: 'string' },
                    website: { type: 'string' },
                    isActive: { type: 'boolean' }
                }
            },
            CreateUserInput: {
                type: 'object',
                properties: {
                    email: { type: 'string', format: 'email' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    password: { type: 'string', minLength: 6 },
                    role: { $ref: '#/components/schemas/UserRole' },
                    isActive: { type: 'boolean' }
                },
                required: [ 'email', 'firstName', 'lastName', 'password' ]
            },
            UpdateUserInput: { $ref: '#/components/schemas/CreateUserInput' },
            UpdateUserRoleInput: {
                type: 'object',
                properties: { role: { $ref: '#/components/schemas/UserRole' } },
                required: [ 'role' ]
            },
            OrgUserRole: { type: 'string', enum: [ 'OWNER', 'ADMIN', 'AGENT', 'VIEWER' ] },
            UserDependenciesOrganization: {
                type: 'object',
                properties: {
                    organization: { $ref: '#/components/schemas/Organization' },
                    role: { $ref: '#/components/schemas/OrgUserRole' },
                    relation: { type: 'string', enum: [ 'OWNER', 'MEMBER' ] }
                },
                required: [ 'organization', 'role', 'relation' ]
            },
            UserDependencies: {
                type: 'object',
                properties: {
                    user: { $ref: '#/components/schemas/User' },
                    organizations: { type: 'array', items: { $ref: '#/components/schemas/UserDependenciesOrganization' } }
                },
                required: [ 'user', 'organizations' ]
            }
            ,
            Customer: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    organizationId: { type: 'string' },
                    whatsappNumber: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    language: { type: 'string' },
                    metadata: { type: 'object', additionalProperties: true },
                    tags: { type: 'array', items: { type: 'string' } },
                    isBlocked: { type: 'boolean' },
                    hasStartedConversation: { type: 'boolean', description: 'True once the customer has at least one conversation' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                },
                required: [ 'id', 'organizationId', 'whatsappNumber' ]
            },
            CreateCustomerInput: {
                type: 'object',
                properties: {
                    organizationId: { type: 'string' },
                    whatsappNumber: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    language: { type: 'string' },
                    metadata: { type: 'object', additionalProperties: true },
                    tags: { type: 'array', items: { type: 'string' } },
                    hasStartedConversation: { type: 'boolean', description: 'Optional flag to mark if the customer has started a conversation', default: false }
                },
                required: [ 'organizationId', 'whatsappNumber' ]
            },
            Conversation: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    organizationId: { type: 'string' },
                    customerId: { type: 'string' },
                    status: { type: 'string', enum: [ 'ACTIVE', 'WAITING_FOR_AGENT', 'WITH_AGENT', 'RESOLVED', 'ARCHIVED' ] },
                    assignedToId: { type: 'string' },
                    priority: { type: 'string', enum: [ 'LOW', 'MEDIUM', 'HIGH', 'URGENT' ] },
                    startedAt: { type: 'string', format: 'date-time' },
                    endedAt: { type: 'string', format: 'date-time' },
                    lastMessageAt: { type: 'string', format: 'date-time' },
                    metadata: { type: 'object', additionalProperties: true }
                },
                required: [ 'id', 'organizationId', 'customerId', 'status', 'priority', 'startedAt', 'lastMessageAt' ]
            },
            Message: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    conversationId: { type: 'string' },
                    whatsappId: { type: 'string' },
                    direction: { type: 'string', enum: [ 'INBOUND', 'OUTBOUND' ] },
                    type: { type: 'string', enum: [ 'TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO', 'LOCATION', 'TEMPLATE' ] },
                    content: { type: 'string' },
                    metadata: { type: 'object', additionalProperties: true },
                    status: { type: 'string', enum: [ 'PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED' ] },
                    isFromAgent: { type: 'boolean' },
                    aiGenerated: { type: 'boolean' },
                    confidence: { type: 'number' },
                    createdAt: { type: 'string', format: 'date-time' },
                    deliveredAt: { type: 'string', format: 'date-time' },
                    readAt: { type: 'string', format: 'date-time' }
                },
                required: [ 'id', 'conversationId', 'direction', 'type', 'content', 'status', 'isFromAgent', 'aiGenerated', 'createdAt' ]
            },
            Document: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    organizationId: { type: 'string' },
                    name: { type: 'string' },
                    originalName: { type: 'string' },
                    type: { type: 'string', enum: [ 'PDF', 'IMAGE', 'TEXT', 'DOCX', 'EXCEL', 'CSV' ] },
                    fileUrl: { type: 'string' },
                    fileSize: { type: 'number' },
                    mimeType: { type: 'string' },
                    status: { type: 'string', enum: [ 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED' ] },
                    uploadedBy: { type: 'string' },
                    processedAt: { type: 'string', format: 'date-time' }
                },
                required: [ 'id', 'organizationId', 'name', 'originalName', 'type', 'fileUrl', 'fileSize', 'mimeType', 'uploadedBy' ]
            },
            UploadDocumentInput: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Optional document name, defaults to original filename' },
                    content: { type: 'string', description: 'Optional document content' }
                }
            },
            Integration: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    organizationId: { type: 'string' },
                    type: { 
                        type: 'string', 
                        enum: ['calendly', 'stripe', 'slack', 'crm', 'email', 'webhook', 'zapier', 'custom'],
                        description: 'Type of integration'
                    },
                    name: { type: 'string' },
                    config: { 
                        type: 'object', 
                        additionalProperties: true,
                        description: 'Integration-specific configuration. Required fields vary by type.'
                    },
                    isActive: { type: 'boolean', default: true },
                    lastTestedAt: { type: 'string', format: 'date-time', nullable: true, description: 'Last time the integration was tested' },
                    testStatus: { type: 'string', enum: ['success', 'failed'], nullable: true, description: 'Status of the last test' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                },
                required: [ 'id', 'organizationId', 'type', 'name', 'config', 'isActive' ]
            },
            CreateIntegrationInput: {
                type: 'object',
                properties: {
                    organizationId: { type: 'string', description: 'Organization ID' },
                    type: { 
                        type: 'string',
                        enum: ['calendly', 'stripe', 'slack', 'crm', 'email', 'webhook', 'zapier', 'custom'],
                        description: 'Type of integration'
                    },
                    name: { type: 'string', description: 'Display name for this integration' },
                    config: { 
                        type: 'object', 
                        additionalProperties: true,
                        description: 'Integration-specific config. For calendly: {apiKey, calendarUrl}. For stripe: {apiKey, publishableKey}. For slack: {botToken, channelId}.'
                    },
                    isActive: { type: 'boolean', default: true, description: 'Whether this integration is active' }
                },
                required: [ 'organizationId', 'type', 'name', 'config' ]
            },
            AnalyticsOverview: {
                type: 'object',
                properties: {
                    totalConversations: { type: 'number' },
                    resolvedByAI: { type: 'number' },
                    handedOffToHuman: { type: 'number' },
                    avgResponse: { type: 'number' },
                    avgResolution: { type: 'number' },
                    avgCSAT: { type: 'number' }
                }
            },
            AnalyticsConversationPoint: {
                type: 'object',
                properties: {
                    date: { type: 'string', format: 'date-time' },
                    totalConversations: { type: 'number' },
                    resolvedByAI: { type: 'number' },
                    handedOffToHuman: { type: 'number' }
                },
                required: [ 'date' ]
            },
            AnalyticsPerformancePoint: {
                type: 'object',
                properties: {
                    date: { type: 'string', format: 'date-time' },
                    averageResponseTime: { type: 'number' },
                    averageResolutionTime: { type: 'number' }
                },
                required: [ 'date' ]
            },
            AnalyticsCSATPoint: {
                type: 'object',
                properties: {
                    date: { type: 'string', format: 'date-time' },
                    customerSatisfaction: { type: 'number' }
                },
                required: [ 'date' ]
            }
        }
    },
    paths: {
        '/api/v1/health/live': {
            get: {
                summary: 'Liveness check',
                responses: {
                    200: {
                        description: 'Service is alive',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { data: { type: 'object', properties: { status: { type: 'string' } } } }
                                }
                            }
                        }
                    }
                },
                tags: [ 'Health' ]
            }
        },
        '/api/v1/health/ready': {
            get: {
                summary: 'Readiness check',
                tags: [ 'Health' ],
                responses: {
                    200: {
                        description: 'Readiness status',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { data: { type: 'object', properties: { status: { type: 'string' } } } }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/auth/register': {
            post: {
                summary: 'Register user',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthRegisterInput' } } }
                },
                tags: [ 'Auth' ],
                responses: {
                    201: {
                        description: 'User registered',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'object',
                                            properties: {
                                                user: { $ref: '#/components/schemas/User' },
                                                tokens: { $ref: '#/components/schemas/Tokens' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/auth/login': {
            post: {
                summary: 'Login',
                tags: [ 'Auth' ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthLoginInput' } } }
                },
                responses: {
                    200: {
                        description: 'Logged in',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'object',
                                            properties: {
                                                user: { $ref: '#/components/schemas/User' },
                                                tokens: { $ref: '#/components/schemas/Tokens' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/auth/refresh': {
            post: {
                summary: 'Refresh tokens',
                tags: [ 'Auth' ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshInput' } } }
                },
                responses: {
                    200: {
                        description: 'New tokens',
                        content: {
                            'application/json': {
                                schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Tokens' } } }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/auth/logout': {
            post: {
                summary: 'Logout',
                tags: [ 'Auth' ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshInput' } } }
                },
                responses: {
                    200: {
                        description: 'Logged out',
                        content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { success: { type: 'boolean' } } } } } } }
                    }
                }
            }
        },
        '/api/v1/auth/forgot-password': {
            post: {
                tags: [ 'Auth' ],
                summary: 'Request password reset',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordInput' } } }
                },
                responses: {
                    200: {
                        description: 'Reset token (testing)',
                        content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { resetToken: { type: 'string' } } } } } } }
                    }
                }
            }
        },
        '/api/v1/auth/reset-password': {
            post: {
                tags: [ 'Auth' ],
                summary: 'Reset password',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordInput' } } }
                },
                responses: {
                    200: {
                        description: 'Password reset',
                        content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { success: { type: 'boolean' } } } } } } }
                    }
                }
            }
        },
        '/api/v1/organizations': {
            get: {
                tags: [ 'Organizations' ],
                summary: 'List organizations',
                responses: {
                    200: {
                        description: 'List',
                        content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Organization' } } } } } }
                    }
                }
            },
            post: {
                summary: 'Create organization',
                description: 'Create a new organization during user registration. WhatsApp fields (whatsappPhoneId, whatsappToken, whatsappBusinessId), website, and agent settings will be added later via dedicated endpoints.',
                tags: [ 'Organizations' ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrganizationInput' } } }
                },
                responses: {
                    201: {
                        description: 'Created',
                        content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Organization' } } } } }
                    }
                }
            }
        },
        '/api/v1/organizations/{id}': {
            get: {
                tags: [ 'Organizations' ],
                summary: 'Get organization',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: {
                    200: { description: 'Org', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Organization' } } } } } },
                    404: { description: 'Not found' }
                }
            },
            put: {
                summary: 'Update organization',
                tags: [ 'Organizations' ],
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateOrganizationInput' } } }
                },
                responses: {
                    200: { description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Organization' } } } } } },
                    404: { description: 'Not found' }
                }
            },
            delete: {
                summary: 'Delete organization',
                tags: [ 'Organizations' ],
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: { 204: { description: 'Deleted' }, 404: { description: 'Not found' } }
            }
        },
        '/api/v1/organizations/{id}/agent-settings': {
            get: {
                tags: [ 'Organizations' ],
                summary: 'Get organization agent settings',
                parameters: [ { in: 'path', name: 'id', required: true, schema: { type: 'string' } } ],
                responses: {
                    200: { description: 'Agent settings', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/AgentSettings' } } } } } },
                    404: { description: 'Not found' }
                }
            },
            put: {
                tags: [ 'Organizations' ],
                summary: 'Update organization agent settings',
                parameters: [ { in: 'path', name: 'id', required: true, schema: { type: 'string' } } ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/AgentSettings' }
                        }
                    }
                },
                responses: {
                    200: { description: 'Agent settings updated', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/AgentSettings' } } } } } },
                    404: { description: 'Not found' }
                }
            }
        },
        '/api/v1/organizations/{id}/settings': {
            get: {
                tags: [ 'Organizations' ],
                summary: 'Get organization settings',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: {
                    200: { description: 'Settings', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', additionalProperties: true } } } } } },
                    404: { description: 'Not found' }
                }
            },
            put: {
                summary: 'Update organization settings',
                tags: [ 'Organizations' ],
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } } },
                responses: {
                    200: { description: 'Settings updated', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', additionalProperties: true } } } } } },
                    404: { description: 'Not found' }
                }
            }
        },
        '/api/v1/organizations/{id}/connect-whatsapp': {
            get: {
                tags: [ 'Organizations' ],
                summary: 'Initiate Meta/WhatsApp OAuth flow for organization',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: {
                    200: {
                        description: 'OAuth URL to redirect the user',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { data: { type: 'object', properties: { url: { type: 'string' } } } }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/organizations/{id}/whatsapp/init-oauth': {
            get: {
                tags: [ 'Organizations' ],
                summary: 'Initialize WhatsApp OAuth flow (Step 1)',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: {
                    200: {
                        description: 'OAuth authorization URL',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        authUrl: { type: 'string', description: 'URL to redirect user for authorization' },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/organizations/whatsapp/callback': {
            get: {
                tags: [ 'Organizations' ],
                summary: 'OAuth callback handler (Step 2)',
                description: 'Handles the callback from Meta OAuth. Returns state token for selecting WABA and phone number.',
                parameters: [
                    { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
                    { name: 'state', in: 'query', required: true, schema: { type: 'string' } }
                ],
                responses: {
                    200: {
                        description: 'Token exchange successful',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        state: { type: 'string', description: 'State token for next steps' },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/organizations/whatsapp/accounts': {
            get: {
                tags: [ 'Organizations' ],
                summary: 'Get available WhatsApp Business Accounts (Step 3)',
                parameters: [ { name: 'state', in: 'query', required: true, schema: { type: 'string' } } ],
                responses: {
                    200: {
                        description: 'List of available accounts',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        wabaOptions: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'string' },
                                                    name: { type: 'string' },
                                                    timezone_id: { type: 'string' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/organizations/whatsapp/phone-numbers': {
            get: {
                tags: [ 'Organizations' ],
                summary: 'Get phone numbers for selected account (Step 4)',
                parameters: [
                    { name: 'state', in: 'query', required: true, schema: { type: 'string' } },
                    { name: 'wabaId', in: 'query', required: true, schema: { type: 'string' } }
                ],
                responses: {
                    200: {
                        description: 'List of available phone numbers',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        phoneOptions: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'string' },
                                                    displayPhoneNumber: { type: 'string' },
                                                    verifiedName: { type: 'string' },
                                                    qualityRating: { type: 'string' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/organizations/{id}/whatsapp/save-config': {
            post: {
                tags: [ 'Organizations' ],
                summary: 'Save WhatsApp configuration (Step 5)',
                description: 'Automatically populates whatsappPhoneId, whatsappBusinessId, and whatsappToken fields on the organization.',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    state: { type: 'string', description: 'OAuth state token from callback' },
                                    wabaId: { type: 'string', description: 'Selected WhatsApp Business Account ID' },
                                    phoneNumberId: { type: 'string', description: 'Selected phone number ID' }
                                },
                                required: [ 'state', 'wabaId', 'phoneNumberId' ]
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Configuration saved with auto-populated WhatsApp fields',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: { $ref: '#/components/schemas/Organization' },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/organizations/{id}/whatsapp/init-baileys': {
            post: {
                tags: [ 'Organizations' ],
                summary: 'Initialize Baileys/QR Code connection (Alternative to OAuth)',
                description: 'Initiates WhatsApp connection using Baileys library with QR code scanning. Sets whatsappAuthType to "baileys" and whatsappConnectionStatus to "pending".',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: {
                    200: {
                        description: 'Baileys connection initialized, QR code ready',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: 'WhatsApp already connected' },
                    404: { description: 'Organization not found' }
                }
            }
        },
        '/api/v1/organizations/{id}/whatsapp/qrcode': {
            get: {
                tags: [ 'Organizations' ],
                summary: 'Get Baileys QR Code for scanning',
                description: 'Retrieves the QR code that the user needs to scan with WhatsApp. Call after initializing Baileys connection.',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: {
                    200: {
                        description: 'QR code generated',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        qrCode: { type: 'string', description: 'QR code data/image' },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    400: { description: 'QR code not available' },
                    404: { description: 'Organization not found' }
                }
            }
        },
        '/api/v1/organizations/{id}/whatsapp/disconnect': {
            delete: {
                tags: [ 'Organizations' ],
                summary: 'Disconnect WhatsApp',
                description: 'Disconnects WhatsApp from the organization. Works for both OAuth and Baileys connections. Sets whatsappConnectionStatus to "disconnected".',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: {
                    200: {
                        description: 'WhatsApp disconnected successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    404: { description: 'Organization not found' }
                }
            }
        },
        '/api/v1/organizations/{id}/whatsapp/status': {
            get: {
                tags: [ 'Organizations' ],
                summary: 'Check WhatsApp Connection Status',
                description: 'Returns the current authentication type and connection status for the organization\'s WhatsApp integration.',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: {
                    200: {
                        description: 'WhatsApp status retrieved',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        authType: { type: 'string', enum: [ 'oauth', 'baileys' ], description: 'Authentication method used' },
                                        connectionStatus: { type: 'string', enum: [ 'connected', 'disconnected', 'pending' ], description: 'Current connection status' },
                                        isConnected: { type: 'boolean', description: 'Whether WhatsApp is currently connected' },
                                        isDisconnected: { type: 'boolean', description: 'Whether WhatsApp is currently disconnected' }
                                    }
                                }
                            }
                        }
                    },
                    404: { description: 'Organization not found' }
                }
            }
        },
        '/api/v1/organizations/oauth/meta/callback': {
            get: {
                tags: [ 'Organizations' ],
                summary: 'Callback endpoint for Meta OAuth (exchanges code for token and stores IDs)',
                parameters: [
                    { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
                    { name: 'state', in: 'query', required: true, schema: { type: 'string' } }
                ],
                responses: {
                    200: {
                        description: 'Success',
                        content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { success: { type: 'boolean' } } } } } } }
                    },
                    400: { description: 'Invalid request or state' },
                    500: { description: 'Server error' }
                }
            }
        },
        '/api/v1/users': {
            get: {
                tags: [ 'Users' ],
                summary: 'List users',
                responses: {
                    200: { description: 'List', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } } } }
                }
            },
            post: {
                tags: [ 'Users' ],
                summary: 'Create user',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUserInput' } } }
                },
                responses: {
                    201: { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/User' } } } } } }
                }
            }
        },
        '/api/v1/users/{id}': {
            get: {
                tags: [ 'Users' ],
                summary: 'Get user',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: {
                    200: { description: 'User', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/User' } } } } } },
                    404: { description: 'Not found' }
                }
            },
            put: {
                tags: [ 'Users' ],
                summary: 'Update user',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUserInput' } } } },
                responses: {
                    200: { description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/User' } } } } } },
                    404: { description: 'Not found' }
                }
            },
            delete: {
                tags: [ 'Users' ],
                summary: 'Delete user',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: { 204: { description: 'Deleted' }, 404: { description: 'Not found' } }
            }
        },
        '/api/v1/users/{id}/dependencies': {
            get: {
                tags: [ 'Users' ],
                summary: 'Get user dependencies (organizations and roles)',
                security: [ { bearerAuth: [] } ],
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: {
                    200: {
                        description: 'User dependencies',
                        content: {
                            'application/json': {
                                schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/UserDependencies' } } }
                            }
                        }
                    },
                    404: { description: 'Not found' }
                }
            }
        },
        '/api/v1/users/{id}/role': {
            put: {
                tags: [ 'Users' ],
                summary: 'Update user role',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUserRoleInput' } } } },
                responses: {
                    200: { description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/User' } } } } } },
                    404: { description: 'Not found' }
                }
            }
        }
        ,
        '/api/v1/customers': {
            get: {
                tags: [ 'Customers' ],
                summary: 'List customers',
                description: 'Returns customers the authenticated user can access. Members and owners see customers for their organizations. Optional filter by organization.',
                security: [ { bearerAuth: [] } ],
                parameters: [
                    { name: 'organizationId', in: 'query', required: false, schema: { type: 'string' }, description: 'Filter by organization ID (must be in user organizations)' }
                ],
                responses: {
                    200: { description: 'List', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Customer' } } } } } } },
                    401: { description: 'Unauthorized' },
                    403: { description: 'Forbidden' }
                }
            },
            post: {
                tags: [ 'Customers' ],
                summary: 'Create customer',
                description: 'Owner-only: Only the organization owner can create customers for that organization.',
                security: [ { bearerAuth: [] } ],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCustomerInput' } } } },
                responses: {
                    201: { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Customer' } } } } } },
                    400: { description: 'Bad Request' },
                    401: { description: 'Unauthorized' },
                    403: { description: 'Forbidden' }
                }
            }
        },
        '/api/v1/customers/bulk': {
            post: {
                tags: [ 'Customers' ],
                summary: 'Bulk create customers',
                description: 'Owner-only: Trigger AI outreach to all new customers (hasStartedConversation=false). Agent crafts message from knowledge base and sends via WhatsApp.',
                security: [ { bearerAuth: [] } ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    organizationId: { type: 'string' },
                                    message: { type: 'string', description: 'Optional hint or theme for the outreach message', maxLength: 4096 }
                                },
                                required: [ 'organizationId' ]
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Triggered', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { count: { type: 'integer' } } } } } } } },
                    400: { description: 'Bad Request' },
                    401: { description: 'Unauthorized' },
                    403: { description: 'Forbidden' }
                }
            }
        },
        '/api/v1/customers/{id}': {
            get: {
                tags: [ 'Customers' ],
                summary: 'Get customer',
                description: 'Members and owners can fetch customers in their organizations.',
                security: [ { bearerAuth: [] } ],
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: {
                    200: { description: 'Customer', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Customer' } } } } } },
                    401: { description: 'Unauthorized' },
                    403: { description: 'Forbidden' },
                    404: { description: 'Not found' }
                }
            },
            put: {
                tags: [ 'Customers' ],
                summary: 'Update customer',
                description: 'Owner-only: Only the organization owner can update customers in their organization.',
                security: [ { bearerAuth: [] } ],
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCustomerInput' } } } },
                responses: {
                    200: { description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Customer' } } } } } },
                    400: { description: 'Bad Request' },
                    401: { description: 'Unauthorized' },
                    403: { description: 'Forbidden' },
                    404: { description: 'Not found' }
                }
            },
            delete: {
                tags: [ 'Customers' ],
                summary: 'Delete customer',
                description: 'Owner-only: Only the organization owner can delete customers in their organization.',
                security: [ { bearerAuth: [] } ],
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: { 204: { description: 'Deleted' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } }
            }
        },
        '/api/v1/customers/{id}/conversations': {
            get: {
                tags: [ 'Customers' ],
                summary: 'List customer conversations',
                description: 'Members and owners can view conversations for customers in their organizations.',
                security: [ { bearerAuth: [] } ],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                    { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1 } },
                    { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100 } },
                    { name: 'status', in: 'query', required: false, schema: { type: 'string' } },
                    { name: 'priority', in: 'query', required: false, schema: { type: 'string' } },
                    { name: 'assignedToId', in: 'query', required: false, schema: { type: 'string' } },
                    { name: 'startDate', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
                    { name: 'endDate', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
                    { name: 'sortBy', in: 'query', required: false, schema: { type: 'string', enum: [ 'lastMessageAt', 'startedAt', 'endedAt' ] } },
                    { name: 'order', in: 'query', required: false, schema: { type: 'string', enum: [ 'asc', 'desc' ] } }
                ],
                responses: {
                    200: {
                        description: 'Paginated conversations',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'object',
                                            properties: {
                                                items: { type: 'array', items: { $ref: '#/components/schemas/Conversation' } },
                                                page: { type: 'integer' },
                                                limit: { type: 'integer' },
                                                total: { type: 'integer' },
                                                pages: { type: 'integer' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: 'Unauthorized' },
                    403: { description: 'Forbidden' },
                    404: { description: 'Not found' }
                }
            }
        },
        '/api/v1/customers/{id}/block': {
            put: {
                tags: [ 'Customers' ],
                summary: 'Block customer',
                description: 'Owner-only: Only the organization owner can block customers in their organization.',
                security: [ { bearerAuth: [] } ],
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: { 200: { description: 'Blocked', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Customer' } } } } } }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } }
            }
        },
        '/api/v1/customers/{id}/unblock': {
            put: {
                tags: [ 'Customers' ],
                summary: 'Unblock customer',
                description: 'Owner-only: Only the organization owner can unblock customers in their organization.',
                security: [ { bearerAuth: [] } ],
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: { 200: { description: 'Unblocked', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Customer' } } } } } }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } }
            }
        },
        '/api/v1/conversations/{id}/messages': {
            get: {
                tags: [ 'Conversations' ],
                summary: 'List messages for a conversation',
                description: 'Members and owners can view messages for conversations in their organizations. Supports pagination and search.',
                security: [ { bearerAuth: [] } ],
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                    { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1 } },
                    { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 200 } },
                    { name: 'q', in: 'query', required: false, schema: { type: 'string' }, description: 'Search text in message content' },
                    { name: 'direction', in: 'query', required: false, schema: { type: 'string', enum: [ 'INBOUND', 'OUTBOUND' ] } },
                    { name: 'type', in: 'query', required: false, schema: { type: 'string', enum: [ 'TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO', 'LOCATION', 'TEMPLATE' ] } },
                    { name: 'status', in: 'query', required: false, schema: { type: 'string', enum: [ 'PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED' ] } },
                    { name: 'startDate', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
                    { name: 'endDate', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
                    { name: 'sortBy', in: 'query', required: false, schema: { type: 'string', enum: [ 'createdAt', 'deliveredAt', 'readAt' ] } },
                    { name: 'order', in: 'query', required: false, schema: { type: 'string', enum: [ 'asc', 'desc' ] } }
                ],
                responses: {
                    200: {
                        description: 'Paginated messages',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'object',
                                            properties: {
                                                items: { type: 'array', items: { $ref: '#/components/schemas/Message' } },
                                                page: { type: 'integer' },
                                                limit: { type: 'integer' },
                                                total: { type: 'integer' },
                                                pages: { type: 'integer' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    401: { description: 'Unauthorized' },
                    403: { description: 'Forbidden' },
                    404: { description: 'Not found' }
                }
            }
        },
        '/api/v1/organizations/{organizationId}/documents/upload': {
            post: {
                tags: [ 'Documents' ],
                summary: 'Upload document (multipart to Cloudinary)',
                description: 'Document type is automatically determined from file MIME type. uploadedBy is automatically set to the authenticated user.',
                parameters: [
                    { name: 'organizationId', in: 'path', required: true, schema: { type: 'string' }, description: 'Organization ID' }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    file: { type: 'string', format: 'binary', description: 'Document file to upload' },
                                    name: { type: 'string', description: 'Optional document name, defaults to original filename' },
                                    content: { type: 'string', description: 'Optional document content' }
                                },
                                required: [ 'file' ]
                            }
                        }
                    }
                },
                responses: { 201: { description: 'Uploaded', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Document' } } } } } } }
            }
        },
        '/api/v1/organizations/{organizationId}/documents': {
            get: {
                tags: [ 'Documents' ],
                summary: 'List documents for organization',
                parameters: [
                    { name: 'organizationId', in: 'path', required: true, schema: { type: 'string' }, description: 'Organization ID' }
                ],
                responses: { 200: { description: 'List', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Document' } } } } } } } }
            }
        },
        '/api/v1/organizations/{organizationId}/documents/{id}': {
            get: {
                tags: [ 'Documents' ],
                summary: 'Get document',
                parameters: [
                    { name: 'organizationId', in: 'path', required: true, schema: { type: 'string' }, description: 'Organization ID' },
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Document ID' }
                ],
                responses: { 200: { description: 'Doc', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Document' } } } } } } }
            },
            delete: {
                tags: [ 'Documents' ],
                summary: 'Delete document',
                parameters: [
                    { name: 'organizationId', in: 'path', required: true, schema: { type: 'string' }, description: 'Organization ID' },
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Document ID' }
                ],
                responses: { 204: { description: 'Deleted' } }
            }
        },
        '/api/v1/organizations/{organizationId}/documents/{id}/reprocess': {
            post: {
                tags: [ 'Documents' ],
                summary: 'Reprocess document',
                parameters: [
                    { name: 'organizationId', in: 'path', required: true, schema: { type: 'string' }, description: 'Organization ID' },
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Document ID' }
                ],
                responses: { 200: { description: 'Queued', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Document' } } } } } } }
            }
        },
        '/api/v1/organizations/{organizationId}/documents/status': {
            get: {
                tags: [ 'Documents' ],
                summary: 'Processing status counts for organization',
                parameters: [
                    { name: 'organizationId', in: 'path', required: true, schema: { type: 'string' }, description: 'Organization ID' }
                ],
                responses: { 200: { description: 'Status', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', additionalProperties: { type: 'number' } } } } } } } }
            }
        },
        '/api/v1/organizations/{organizationId}/documents/bulk-upload': {
            post: {
                tags: [ 'Documents' ],
                summary: 'Bulk upload documents for organization',
                parameters: [
                    { name: 'organizationId', in: 'path', required: true, schema: { type: 'string' }, description: 'Organization ID' }
                ],
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/UploadDocumentInput' } } } } } } },
                responses: { 201: { description: 'Uploaded', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Document' } } } } } } } }
            }
        },
        '/api/v1/integrations': {
            get: {
                tags: [ 'Integrations' ],
                summary: 'List integrations',
                description: 'List all integrations, optionally filtered by organizationId and/or type',
                parameters: [
                    { 
                        name: 'organizationId', 
                        in: 'query', 
                        required: false, 
                        schema: { type: 'string' },
                        description: 'Filter by organization ID'
                    },
                    { 
                        name: 'type', 
                        in: 'query', 
                        required: false, 
                        schema: { type: 'string', enum: ['calendly', 'stripe', 'slack', 'crm', 'email', 'webhook', 'zapier', 'custom'] },
                        description: 'Filter by integration type'
                    }
                ],
                responses: { 200: { description: 'List of integrations', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Integration' } } } } } } } }
            },
            post: {
                tags: [ 'Integrations' ],
                summary: 'Create integration',
                description: 'Create a new integration. Required config fields vary by type.',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateIntegrationInput' } } } },
                responses: { 
                    201: { description: 'Integration created successfully', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Integration' } } } } } },
                    400: { description: 'Bad request - missing required fields or invalid config' }
                }
            }
        },
        '/api/v1/integrations/{id}': {
            get: {
                tags: [ 'Integrations' ],
                summary: 'Get integration by ID',
                description: 'Retrieve a specific integration by its ID',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Integration ID' } ],
                responses: { 
                    200: { description: 'Integration details', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Integration' } } } } } },
                    404: { description: 'Integration not found' }
                }
            },
            put: {
                tags: [ 'Integrations' ],
                summary: 'Update integration',
                description: 'Update an existing integration. All fields are optional.',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Integration ID' } ],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateIntegrationInput' } } } },
                responses: { 
                    200: { description: 'Integration updated successfully', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Integration' } } } } } },
                    400: { description: 'Bad request - invalid config for type' },
                    404: { description: 'Integration not found' }
                }
            },
            delete: {
                tags: [ 'Integrations' ],
                summary: 'Delete integration',
                description: 'Delete an integration permanently',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Integration ID' } ],
                responses: { 
                    204: { description: 'Integration deleted successfully' },
                    404: { description: 'Integration not found' }
                }
            }
        },
        '/api/v1/integrations/{id}/test': {
            post: {
                tags: [ 'Integrations' ],
                summary: 'Test integration connection',
                description: 'Verify that the integration credentials are valid and the connection works. Updates the lastTestedAt and testStatus fields.',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Integration ID' } ],
                responses: { 
                    200: { 
                        description: 'Test result', 
                        content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } } } } 
                    },
                    404: { description: 'Integration not found' }
                }
            }
        },
        '/api/v1/webhook/whatsapp': {
            get: { tags: [ 'Webhooks' ], summary: 'WhatsApp webhook verification', responses: { 200: { description: 'Challenge' }, 403: { description: 'Forbidden' } } },
            post: { tags: [ 'Webhooks' ], summary: 'WhatsApp webhook events', responses: { 200: { description: 'Received' } } }
        },
        '/api/v1/analytics/overview': {
            get: {
                tags: [ 'Analytics' ],
                summary: 'Overview metrics',
                security: [ { bearerAuth: [] } ],
                parameters: [
                    { name: 'organizationId', in: 'query', required: true, schema: { type: 'string' } },
                    { name: 'startDate', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
                    { name: 'endDate', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } }
                ],
                responses: {
                    200: {
                        description: 'Overview',
                        content: {
                            'application/json': {
                                schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/AnalyticsOverview' } } }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/analytics/conversations': {
            get: {
                tags: [ 'Analytics' ],
                summary: 'Conversations metrics',
                security: [ { bearerAuth: [] } ],
                parameters: [
                    { name: 'organizationId', in: 'query', required: true, schema: { type: 'string' } },
                    { name: 'startDate', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
                    { name: 'endDate', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } }
                ],
                responses: {
                    200: {
                        description: 'Timeseries',
                        content: {
                            'application/json': {
                                schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/AnalyticsConversationPoint' } } } }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/analytics/performance': {
            get: {
                tags: [ 'Analytics' ],
                summary: 'Performance metrics',
                security: [ { bearerAuth: [] } ],
                parameters: [
                    { name: 'organizationId', in: 'query', required: true, schema: { type: 'string' } },
                    { name: 'startDate', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
                    { name: 'endDate', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } }
                ],
                responses: {
                    200: {
                        description: 'Timeseries',
                        content: {
                            'application/json': {
                                schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/AnalyticsPerformancePoint' } } } }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/analytics/customer-satisfaction': {
            get: {
                tags: [ 'Analytics' ],
                summary: 'Customer satisfaction metrics',
                security: [ { bearerAuth: [] } ],
                parameters: [
                    { name: 'organizationId', in: 'query', required: true, schema: { type: 'string' } },
                    { name: 'startDate', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
                    { name: 'endDate', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } }
                ],
                responses: {
                    200: {
                        description: 'Timeseries',
                        content: {
                            'application/json': {
                                schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/AnalyticsCSATPoint' } } } }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/analytics/agent-performance': {
            get: {
                tags: [ 'Analytics' ],
                summary: 'Agent performance metrics',
                security: [ { bearerAuth: [] } ],
                parameters: [
                    { name: 'organizationId', in: 'query', required: true, schema: { type: 'string' } },
                    { name: 'startDate', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
                    { name: 'endDate', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } }
                ],
                responses: {
                    200: {
                        description: 'Timeseries',
                        content: {
                            'application/json': {
                                schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/AnalyticsPerformancePoint' } } } }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/analytics/export': {
            get: {
                tags: [ 'Analytics' ],
                summary: 'Export CSV',
                security: [ { bearerAuth: [] } ],
                parameters: [
                    { name: 'organizationId', in: 'query', required: true, schema: { type: 'string' } },
                    { name: 'startDate', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } },
                    { name: 'endDate', in: 'query', required: false, schema: { type: 'string', format: 'date-time' } }
                ],
                responses: {
                    200: {
                        description: 'CSV export',
                        content: {
                            'text/csv': { schema: { type: 'string' } }
                        }
                    }
                }
            }
        }
    }
};

const options = { definition, apis: [] };

export const openapiSpec = swaggerJSDoc(options);
