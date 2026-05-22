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
            projectId: { type: 'string', format: 'uuid', nullable: true },
            categoryId: { type: 'string', format: 'uuid', nullable: true },
            category: { '$ref': '#/components/schemas/Category', nullable: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Bug', description: 'Bug | Feature | Improvement' },
            color: { type: 'string', example: '#e74c3c', description: '7-char hex color for the badge' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        ProjectSettings: {
          type: 'object',
          properties: {
            projectId: { type: 'string', format: 'uuid' },
            description: { type: 'string', nullable: true },
            color: { type: 'string', example: '#4c90f0', description: '7-char hex color for the UI chip' },
            isPublic: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            userId: { type: 'string', format: 'uuid', description: 'Creator of the project' },
            createdAt: { type: 'string', format: 'date-time' },
            settings: { '$ref': '#/components/schemas/ProjectSettings' },
            memberRole: {
              type: 'string',
              enum: ['OWNER', 'MEMBER'],
              nullable: true,
              description: 'Role of the requesting user. null means not a member yet.'
            },
            memberCount: { type: 'integer', description: 'Total number of members' }
          }
        },
        ProjectMember: {
          type: 'object',
          properties: {
            userId: { type: 'string', format: 'uuid' },
            name: { type: 'string', nullable: true },
            email: { type: 'string' },
            role: { type: 'string', enum: ['OWNER', 'MEMBER'] },
            joinedAt: { type: 'string', format: 'date-time' }
          }
        },
        Tag: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', maxLength: 30 },
            color: { type: 'string', example: '#e03131', description: '7-char hex color' },
            projectId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            taskCount: { type: 'integer', description: 'Number of tasks using this tag' }
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
      '/api/categories': {
        get: {
          summary: 'List all task categories',
          description: 'Returns the global categories reference list (Bug, Feature, Improvement). Categories are seeded at startup and are read-only through the API.',
          tags: ['Categories'],
          responses: {
            200: {
              description: 'Array of all categories ordered by name',
              content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Category' } } } }
            },
            401: { description: 'Missing or invalid token' }
          }
        }
      },
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
          summary: 'Get visible tasks (own + project member tasks)',
          description: 'Returns tasks the user created AND tasks in projects they are a member of. Write operations (edit/delete) remain restricted to the task creator.',
          tags: ['Tasks'],
          responses: {
            200: {
              description: 'Array of tasks visible to the authenticated user',
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
                    status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
                    categoryId: { type: 'string', format: 'uuid', nullable: true }
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
      },
      '/api/projects': {
        get: {
          summary: 'List all projects (organisation-wide)',
          description: 'Returns all projects visible to authenticated users. Each project includes its settings and the requesting user\'s membership role (null = not a member yet).',
          tags: ['Projects'],
          responses: {
            200: {
              description: 'Array of enriched projects',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { '$ref': '#/components/schemas/Project' } }
                }
              }
            },
            401: { description: 'Not authenticated' }
          }
        },
        post: {
          summary: 'Create a new project',
          description: 'Creates a project and automatically adds the creator as OWNER. Also creates a project_settings row.',
          tags: ['Projects'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 50, example: 'Backend Refactor' },
                    color: { type: 'string', example: '#e d6c02', description: '7-char hex. Defaults to #4c90f0' },
                    description: { type: 'string', nullable: true, example: 'Refactor the API layer' },
                    isPublic: { type: 'boolean', default: true }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Project created with settings and OWNER membership',
              content: { 'application/json': { schema: { '$ref': '#/components/schemas/Project' } } }
            },
            400: { description: 'Validation error (name too short/long or invalid color)' },
            401: { description: 'Not authenticated' }
          }
        }
      },
      '/api/projects/{id}': {
        patch: {
          summary: 'Rename a project (OWNER only)',
          description: 'Updates the project name. Only the project OWNER can perform this action.',
          tags: ['Projects'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: { name: { type: 'string', minLength: 2, maxLength: 50, example: 'My Renamed Project' } }
                }
              }
            }
          },
          responses: {
            200: { description: 'Project renamed', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Project' } } } },
            400: { description: 'Validation error (name too short/long)' },
            403: { description: 'Not the owner of this project' },
            401: { description: 'Not authenticated' }
          }
        },
        delete: {
          summary: 'Delete a project (OWNER only)',
          description: 'Permanently deletes the project and ALL its tasks, tags, settings and memberships via DB CASCADE. Only the project OWNER can perform this action.',
          tags: ['Projects'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            204: { description: 'Project deleted (no content)' },
            403: { description: 'Not the owner of this project' },
            404: { description: 'Project not found' },
            401: { description: 'Not authenticated' }
          }
        }
      },
      '/api/projects/{id}/join': {
        post: {
          summary: 'Join a project as MEMBER',
          description: 'Adds the authenticated user to the project with role MEMBER. Returns 409 if already a member.',
          tags: ['Projects'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Joined successfully' },
            409: { description: 'Already a member of this project' },
            401: { description: 'Not authenticated' }
          }
        }
      },
      '/api/projects/{id}/leave': {
        delete: {
          summary: 'Leave a project (MEMBER only)',
          description: 'Removes the authenticated user from the project. OWNERs cannot leave — they must delete the project instead.',
          tags: ['Projects'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Left project successfully' },
            403: { description: 'Owner cannot leave — delete the project instead' },
            404: { description: 'Not a member of this project' },
            401: { description: 'Not authenticated' }
          }
        }
      },
      '/api/projects/{id}/members': {
        get: {
          summary: 'List members of a project',
          description: 'Returns all members with their roles, names and join dates.',
          tags: ['Projects'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: {
              description: 'Array of project members',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { '$ref': '#/components/schemas/ProjectMember' } }
                }
              }
            },
            401: { description: 'Not authenticated' }
          }
        }
      },
      '/api/projects/{id}/tags': {
        get: {
          summary: 'List tags of a project',
          description: 'Returns all tags defined in the project, each with a taskCount showing how many tasks use it.',
          tags: ['Tags'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: {
              description: 'Array of tags with task usage counts',
              content: { 'application/json': { schema: { type: 'array', items: { '$ref': '#/components/schemas/Tag' } } } }
            },
            401: { description: 'Not authenticated' }
          }
        },
        post: {
          summary: 'Create a tag in a project',
          description: 'Creates a new tag scoped to the project. Requires the user to be a member (OWNER or MEMBER).',
          tags: ['Tags'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', maxLength: 30, example: 'Bug' },
                    color: { type: 'string', example: '#e03131', description: '7-char hex. Defaults to #4c90f0' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Tag created', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Tag' } } } },
            400: { description: 'Validation error' },
            403: { description: 'Not a project member' },
            401: { description: 'Not authenticated' }
          }
        }
      },
      '/api/projects/{id}/tags/{tagId}': {
        delete: {
          summary: 'Delete a tag from a project (OWNER only)',
          description: 'Deletes the tag and removes it from all tasks automatically (CASCADE). Only the project OWNER can do this.',
          tags: ['Tags'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            { name: 'tagId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
          ],
          responses: {
            204: { description: 'Tag deleted' },
            403: { description: 'Only the project owner can delete tags' },
            404: { description: 'Tag not found' },
            401: { description: 'Not authenticated' }
          }
        }
      },
      '/api/tasks/{id}/tags/{tagId}': {
        post: {
          summary: 'Assign a tag to a task',
          description: 'The tag must belong to the same project as the task. The user must own the task.',
          tags: ['Tags'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Task ID' },
            { name: 'tagId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
          ],
          responses: {
            200: { description: 'Tag assigned successfully' },
            400: { description: 'Task does not belong to a project' },
            404: { description: 'Task or tag not found' },
            409: { description: 'Tag already assigned to this task' },
            401: { description: 'Not authenticated' }
          }
        },
        delete: {
          summary: 'Remove a tag from a task',
          description: 'The user must own the task.',
          tags: ['Tags'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Task ID' },
            { name: 'tagId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
          ],
          responses: {
            200: { description: 'Tag removed successfully' },
            404: { description: 'Task not found or tag not assigned' },
            401: { description: 'Not authenticated' }
          }
        }
      }
    }
  },
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);