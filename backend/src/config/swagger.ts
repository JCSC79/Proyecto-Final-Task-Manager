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
          summary: 'Login — get JWT cookie',
          tags: ['Authentication'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'admin@example.com' },
                    password: { type: 'string', example: 'Admin1234!' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'JWT set as HttpOnly cookie + user info returned' },
            401: { description: 'Invalid credentials' },
            429: { description: 'Too many login attempts' }
          }
        }
      },
      '/api/auth/register': {
        post: {
          summary: 'Register a new user account',
          tags: ['Authentication'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'new@example.com' },
                    password: { type: 'string', example: 'Secure1234!' },
                    name: { type: 'string', example: 'Jane Doe' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'User created — JWT cookie set' },
            409: { description: 'Email already registered' },
            429: { description: 'Too many registration attempts' }
          }
        }
      },
      '/api/auth/logout': {
        post: {
          summary: 'Logout — clears the JWT cookie',
          tags: ['Authentication'],
          responses: {
            200: { description: 'Cookie cleared' }
          }
        }
      },
      '/api/auth/me': {
        patch: {
          summary: 'Update display name of authenticated user',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'New Display Name' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Profile updated' },
            401: { description: 'Not authenticated' }
          }
        }
      },
      '/api/tasks': {
        get: {
          summary: 'Get my tasks (user-isolated)',
          tags: ['Tasks'],
          responses: {
            200: {
              description: 'Array of tasks owned by the authenticated user',
              content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Task' } } } }
            },
            401: { description: 'Missing or invalid token' }
          }
        },
        post: {
          summary: 'Create a new task',
          tags: ['Tasks'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'description'],
                  properties: {
                    title: { type: 'string', example: 'Fix login bug' },
                    description: { type: 'string', example: 'Users cannot log in on Safari' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Task created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } },
            400: { description: 'Validation error' },
            401: { description: 'Not authenticated' }
          }
        },
        delete: {
          summary: 'Bulk delete tasks (all or by status)',
          tags: ['Tasks'],
          parameters: [
            {
              name: 'status',
              in: 'query',
              required: false,
              description: 'If provided, only tasks with this status are deleted',
              schema: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] }
            }
          ],
          responses: {
            204: { description: 'Tasks deleted' },
            400: { description: 'Invalid status value' },
            401: { description: 'Not authenticated' }
          }
        }
      },
      '/api/tasks/{id}': {
        get: {
          summary: 'Get a specific task',
          tags: ['Tasks'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Task found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } },
            404: { description: 'Task not found or access denied' }
          }
        },
        patch: {
          summary: 'Update a task',
          tags: ['Tasks'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
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
          responses: {
            200: { description: 'Task updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } },
            400: { description: 'Validation error' },
            403: { description: 'Forbidden — task belongs to another user' }
          }
        },
        delete: {
          summary: 'Delete a specific task',
          tags: ['Tasks'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            204: { description: 'Task deleted' },
            403: { description: 'Forbidden — task belongs to another user' }
          }
        }
      },
      '/api/admin/users': {
        get: {
          summary: 'List all users with task stats (Admin only)',
          tags: ['Admin'],
          responses: {
            200: { description: 'Array of users with aggregated task counts' },
            401: { description: 'Not authenticated' },
            403: { description: 'Admin role required' }
          }
        }
      },
      '/api/admin/users/{id}/role': {
        patch: {
          summary: 'Promote or demote a user role (Admin only)',
          tags: ['Admin'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['role'],
                  properties: {
                    role: { type: 'string', enum: ['admin', 'user'] }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Role updated' },
            403: { description: 'Admin role required' },
            404: { description: 'User not found' }
          }
        }
      }
    }
  },
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);