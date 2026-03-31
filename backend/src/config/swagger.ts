import swaggerJSDoc from 'swagger-jsdoc';

/**
 * Swagger Configuration - Enterprise Edition
 * Includes JWT Authentication (Bearer) and Auth endpoints for full testing capability.
 */
const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Manager API - PRO',
      version: '1.2.0',
      description: 'Distributed task management with User Isolation and RabbitMQ.',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Development Server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Login via /api/auth/login to get your token, then paste it here.'
        },
      },
      schemas: {
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
            userId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: { error: { type: 'string' } }
        }
      }
    },
    // This adds the "Authorize" lock button globally
    security: [{ bearerAuth: [] }],
    paths: {
      '/api/auth/login': {
        post: {
          summary: 'Get JWT Access Token',
          tags: ['Authentication'],
          security: [], // Public endpoint (no lock icon here)
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'admin@test.com' },
                    password: { type: 'string', example: 'AdminPassword123!' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Success - Returns Token and User info' },
            401: { description: 'Unauthorized - Invalid credentials' }
          }
        }
      },
      '/tasks': {
        get: {
          summary: 'Retrieve my tasks (Isolation Active)',
          tags: ['Tasks'],
          responses: {
            200: {
              description: 'Array of user-owned tasks',
              content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Task' } } } }
            },
            401: { description: 'Missing or invalid Token' }
          }
        },
        post: {
          summary: 'Create a new task for current user',
          tags: ['Tasks'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'description'],
                  properties: { title: { type: 'string' }, description: { type: 'string' } }
                }
              }
            }
          },
          responses: {
            201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } }
          }
        },
        delete: {
          summary: 'Clear my board',
          tags: ['Tasks'],
          responses: { 204: { description: 'All your tasks deleted' } }
        }
      },
      '/tasks/{id}': {
        get: {
          summary: 'Get specific task',
          tags: ['Tasks'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { $ref: '#/components/schemas/Task' },
            404: { description: 'Task not found or access denied' }
          }
        },
        patch: {
          summary: 'Update task details',
          tags: ['Tasks'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Updated' } }
        },
        delete: {
          summary: 'Remove task',
          tags: ['Tasks'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 204: { description: 'Deleted' } }
        }
      }
    }
  },
  apis: [], 
};

export const swaggerSpec = swaggerJSDoc(options);