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
                    isActive: { type: 'boolean' },
                    settings: { type: 'object', additionalProperties: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                },
                required: [ 'id', 'name', 'isActive' ]
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
                    name: { type: 'string' },
                    description: { type: 'string' },
                    industry: { type: 'string' },
                    website: { type: 'string' },
                    whatsappPhoneId: { type: 'string' },
                    whatsappToken: { type: 'string' },
                    whatsappBusinessId: { type: 'string' },
                    isActive: { type: 'boolean' },
                    settings: { type: 'object', additionalProperties: true }
                },
                required: [ 'name' ]
            },
            UpdateOrganizationInput: { $ref: '#/components/schemas/CreateOrganizationInput' },
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
                    tags: { type: 'array', items: { type: 'string' } }
                },
                required: [ 'organizationId', 'whatsappNumber' ]
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
                    organizationId: { type: 'string' },
                    name: { type: 'string' },
                    originalName: { type: 'string' },
                    type: { type: 'string' },
                    fileUrl: { type: 'string' },
                    fileSize: { type: 'number' },
                    mimeType: { type: 'string' },
                    uploadedBy: { type: 'string' },
                    content: { type: 'string' }
                },
                required: [ 'organizationId', 'name', 'originalName', 'type', 'fileUrl', 'fileSize', 'mimeType', 'uploadedBy' ]
            },
            Integration: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    organizationId: { type: 'string' },
                    type: { type: 'string' },
                    name: { type: 'string' },
                    config: { type: 'object', additionalProperties: true },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                },
                required: [ 'id', 'organizationId', 'type', 'name' ]
            },
            CreateIntegrationInput: {
                type: 'object',
                properties: {
                    organizationId: { type: 'string' },
                    type: { type: 'string' },
                    name: { type: 'string' },
                    config: { type: 'object', additionalProperties: true },
                    isActive: { type: 'boolean' }
                },
                required: [ 'organizationId', 'type', 'name' ]
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
                responses: {
                    200: { description: 'List', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Customer' } } } } } } }
                }
            },
            post: {
                tags: [ 'Customers' ],
                summary: 'Create customer',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCustomerInput' } } } },
                responses: {
                    201: { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Customer' } } } } } }
                }
            }
        },
        '/api/v1/customers/{id}': {
            get: {
                tags: [ 'Customers' ],
                summary: 'Get customer',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: {
                    200: { description: 'Customer', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Customer' } } } } } },
                    404: { description: 'Not found' }
                }
            },
            put: {
                tags: [ 'Customers' ],
                summary: 'Update customer',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCustomerInput' } } } },
                responses: {
                    200: { description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Customer' } } } } } },
                    404: { description: 'Not found' }
                }
            },
            delete: {
                tags: [ 'Customers' ],
                summary: 'Delete customer',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: { 204: { description: 'Deleted' }, 404: { description: 'Not found' } }
            }
        },
        '/api/v1/customers/{id}/conversations': {
            get: {
                tags: [ 'Customers' ],
                summary: 'List customer conversations',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: { 200: { description: 'List', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object' } } } } } } } }
            }
        },
        '/api/v1/customers/{id}/block': {
            put: {
                tags: [ 'Customers' ],
                summary: 'Block customer',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: { 200: { description: 'Blocked', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Customer' } } } } } } }
            }
        },
        '/api/v1/customers/{id}/unblock': {
            put: {
                tags: [ 'Customers' ],
                summary: 'Unblock customer',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: { 200: { description: 'Unblocked', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Customer' } } } } } } }
            }
        },
        '/api/v1/documents/upload': {
            post: {
                tags: [ 'Documents' ],
                summary: 'Upload document (multipart to Cloudinary)',
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    file: { type: 'string', format: 'binary' },
                                    organizationId: { type: 'string' },
                                    name: { type: 'string' },
                                    type: { type: 'string' },
                                    uploadedBy: { type: 'string' },
                                    content: { type: 'string' }
                                },
                                required: [ 'file', 'organizationId', 'uploadedBy' ]
                            }
                        }
                    }
                },
                responses: { 201: { description: 'Uploaded', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Document' } } } } } } }
            }
        },
        '/api/v1/documents': {
            get: {
                tags: [ 'Documents' ],
                summary: 'List documents',
                responses: { 200: { description: 'List', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Document' } } } } } } } }
            }
        },
        '/api/v1/documents/{id}': {
            get: {
                tags: [ 'Documents' ],
                summary: 'Get document',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: { 200: { description: 'Doc', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Document' } } } } } } }
            },
            delete: {
                tags: [ 'Documents' ],
                summary: 'Delete document',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: { 204: { description: 'Deleted' } }
            }
        },
        '/api/v1/documents/{id}/reprocess': {
            post: {
                tags: [ 'Documents' ],
                summary: 'Reprocess document',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: { 200: { description: 'Queued', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Document' } } } } } } }
            }
        },
        '/api/v1/documents/status': {
            get: {
                tags: [ 'Documents' ],
                summary: 'Processing status counts',
                responses: { 200: { description: 'Status', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', additionalProperties: { type: 'number' } } } } } } } }
            }
        },
        '/api/v1/documents/bulk-upload': {
            post: {
                tags: [ 'Documents' ],
                summary: 'Bulk upload documents',
                requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/UploadDocumentInput' } } } } } } },
                responses: { 201: { description: 'Uploaded', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Document' } } } } } } } }
            }
        },
        '/api/v1/integrations': {
            get: {
                tags: [ 'Integrations' ],
                summary: 'List integrations',
                responses: { 200: { description: 'List', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Integration' } } } } } } } }
            },
            post: {
                tags: [ 'Integrations' ],
                summary: 'Create integration',
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateIntegrationInput' } } } },
                responses: { 201: { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Integration' } } } } } } }
            }
        },
        '/api/v1/integrations/{id}': {
            get: {
                tags: [ 'Integrations' ],
                summary: 'Get integration',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: { 200: { description: 'Integration', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Integration' } } } } } } }
            },
            put: {
                tags: [ 'Integrations' ],
                summary: 'Update integration',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateIntegrationInput' } } } },
                responses: { 200: { description: 'Updated', content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: '#/components/schemas/Integration' } } } } } } }
            },
            delete: {
                tags: [ 'Integrations' ],
                summary: 'Delete integration',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: { 204: { description: 'Deleted' } }
            }
        },
        '/api/v1/integrations/{id}/test': {
            post: {
                tags: [ 'Integrations' ],
                summary: 'Test integration',
                parameters: [ { name: 'id', in: 'path', required: true, schema: { type: 'string' } } ],
                responses: { 200: { description: 'Result', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object', properties: { success: { type: 'boolean' } } } } } } } } }
            }
        },
        '/api/v1/webhook/whatsapp': {
            get: { tags: [ 'Webhooks' ], summary: 'WhatsApp webhook verification', responses: { 200: { description: 'Challenge' }, 403: { description: 'Forbidden' } } },
            post: { tags: [ 'Webhooks' ], summary: 'WhatsApp webhook events', responses: { 200: { description: 'Received' } } }
        },
        '/api/v1/analytics/overview': {
            get: { tags: [ 'Analytics' ], summary: 'Overview metrics', responses: { 200: { description: 'Overview', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object' } } } } } } } }
        },
        '/api/v1/analytics/conversations': {
            get: { tags: [ 'Analytics' ], summary: 'Conversations metrics', responses: { 200: { description: 'Timeseries', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object' } } } } } } } } }
        },
        '/api/v1/analytics/performance': {
            get: { tags: [ 'Analytics' ], summary: 'Performance metrics', responses: { 200: { description: 'Timeseries', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object' } } } } } } } } }
        },
        '/api/v1/analytics/customer-satisfaction': {
            get: { tags: [ 'Analytics' ], summary: 'Customer satisfaction metrics', responses: { 200: { description: 'Timeseries', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object' } } } } } } } } }
        },
        '/api/v1/analytics/agent-performance': {
            get: { tags: [ 'Analytics' ], summary: 'Agent performance metrics', responses: { 200: { description: 'Timeseries', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { type: 'object' } } } } } } } } }
        },
        '/api/v1/analytics/export': {
            get: { tags: [ 'Analytics' ], summary: 'Export CSV', responses: { 200: { description: 'CSV' } } }
        }
    }
};

const options = { definition, apis: [] };

export const openapiSpec = swaggerJSDoc(options);
