import swaggerJSDoc from 'swagger-jsdoc';

/**
 * Swagger Configuration
 * Updated for Phase 4: Includes JWT Authentication, User management, 
 * and protected task operations.
 */
const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Manager API',
      version: '1.0.0',
      description: 'Distributed task management API with JWT Authentication, RabbitMQ, and PostgreSQL',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Development Server' }],
    components: {
      securitySchemes: {
        // Define the JWT Security Scheme
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string' },
            role: { type: 'string' }
          }
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
            userId: { type: 'string', format: 'uuid' }, // Linked user
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: { error: { type: 'string' } }
        }
      }
    },
    paths: {
      //  AUTHENTICATION ENDPOINTS
      '/auth/register': {
        post: {
          summary: 'Register a new user',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'user@example.com' },
                    password: { type: 'string', example: 'securePassword123' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'User created', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            400: { description: 'Email already exists' }
          }
        }
      },
      '/auth/login': {
        post: {
          summary: 'Login to get access token',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: { 
              description: 'Login successful', 
              content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' } } } } } 
            },
            401: { description: 'Invalid credentials' }
          }
        }
      },
      // TASK ENDPOINTS (Now Protected)
      '/tasks': {
        get: {
          summary: 'Retrieve all tasks',
          tags: ['Tasks'],
          security: [{ bearerAuth: [] }], // Requires token
          responses: {
            200: {
              description: 'Success',
              content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Task' } } } }
            },
            401: { description: 'Unauthorized' }
          }
        },
        post: {
          summary: 'Create a new task',
          tags: ['Tasks'],
          security: [{ bearerAuth: [] }], // Requires token
          requestBody: {
            required: true,
            content: { 
              'application/json': { 
                schema: { 
                  type: 'object', 
                  required: ['title', 'description'],
                  properties: { 
                    title: { type: 'string' }, 
                    description: { type: 'string' } 
                  } 
                } 
              } 
            }
          },
          responses: {
            201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } },
            400: { description: 'Validation Error' },
            401: { description: 'Unauthorized' }
          }
        },
        delete: {
          summary: 'Delete all tasks (Clear Board)',
          tags: ['Tasks'],
          security: [{ bearerAuth: [] }], // Requires token
          responses: {
            204: { description: 'All tasks successfully deleted' },
            401: { description: 'Unauthorized' }
          }
        }
      },
      '/tasks/{id}': {
        get: {
          summary: 'Get task by ID',
          tags: ['Tasks'],
          security: [{ bearerAuth: [] }], // Requires token
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } },
            401: { description: 'Unauthorized' },
            404: { description: 'Not found' }
          }
        },
        patch: {
          summary: 'Update task details or status',
          tags: ['Tasks'],
          security: [{ bearerAuth: [] }], // Requires token
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
          responses: {
            200: { description: 'Updated successfully' },
            401: { description: 'Unauthorized' },
            404: { description: 'Task not found' }
          }
        },
        delete: {
          summary: 'Delete a specific task',
          tags: ['Tasks'],
          security: [{ bearerAuth: [] }], // Requires token
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 
            204: { description: 'Deleted' }, 
            401: { description: 'Unauthorized' },
            404: { description: 'Not found' } 
          }
        }
      }
    }
  },
  apis: [], 
};

export const swaggerSpec = swaggerJSDoc(options);