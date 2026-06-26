# Task Manager — Backend

REST API built with **Node.js 24**, **Express 5**, **TypeScript** (strict / zero-any), **PostgreSQL 15**, and **RabbitMQ**. Implements JWT authentication (httpOnly cookie), role-based access control (RBAC), Yup input validation, the Result Pattern throughout, and async email notifications via a dedicated worker process.

> This README covers the backend in isolation. For the full project setup (Docker Compose, environment variables, frontend) see the [root README](../README.md).

---

## Architecture

```text
src/
├── server.ts               Express app — middleware stack + route mounting
├── worker.ts               RabbitMQ consumer — sends emails from queued events
├── config/
│   └── swagger.ts          OpenAPI 3.0 spec v2.0.0 (served at /api-docs)
├── controllers/            HTTP layer — parse request, call service, return response
│   ├── auth.controller.ts
│   ├── task.controller.ts
│   ├── project.controller.ts
│   ├── category.controller.ts
│   ├── tag.controller.ts
│   └── admin.controller.ts
├── services/               Business logic — framework-agnostic
│   ├── auth.service.ts     JWT generation, bcrypt hashing, user registration
│   ├── task.service.ts     Task CRUD with per-user isolation + membership guard
│   ├── messaging.service.ts  RabbitMQ producer (task_notifications + audit_events)
│   ├── email.service.ts    Nodemailer wrapper — Ethereal (dev) or SMTP (prod)
│   ├── pdf.service.ts      PDF generation (pdfkit) for task and admin exports
│   ├── auth.service.test.ts
│   ├── task.service.test.ts
│   └── security.test.ts
├── daos/                   Data Access Objects — all Knex queries here
│   ├── user.dao.ts
│   ├── task.dao.ts         JOINs projects + users for denormalised response
│   ├── project.dao.ts      Project CRUD + member management + role queries
│   ├── category.dao.ts
│   └── tag.dao.ts
├── middlewares/
│   ├── auth.middleware.ts  JWT guard (authenticateToken)
│   └── admin.middleware.ts RBAC guard (requireAdmin)
├── models/                 TypeScript interfaces (IUser, ITask, IProject…)
├── routes/
│   ├── auth.routes.ts
│   ├── task.routes.ts      (also mounts GET /:id/history)
│   ├── project.routes.ts
│   ├── category.routes.ts
│   ├── tag.routes.ts
│   └── admin.routes.ts
├── schemas/                Yup validation schemas
│   ├── task.schema.ts
│   └── user.schema.ts
├── db/
│   ├── migrations/         Knex migration files (applied in order)
│   └── seeds/              Default users + stress-test task dataset
└── utils/
    └── result.ts           Generic Result<T, E> pattern
```

---

## API Endpoints

All endpoints except `/api/auth/*` and `/health` require a valid JWT (httpOnly cookie).

### System

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | ✗ | Returns `{ status: "ok" }`. Used by Docker healthchecks. |

### Auth — `/api/auth`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | ✗ | Create a new USER account. Rate-limited: 5 req/hour. |
| `POST` | `/api/auth/login` | ✗ | Validate credentials, set httpOnly cookie. Rate-limited: 10 req/15 min. |
| `POST` | `/api/auth/logout` | ✓ | Clear auth cookie. |
| `PATCH` | `/api/auth/me` | ✓ | Update the logged-in user''s display name. |

### Tasks — `/api/tasks`

All task endpoints are scoped to the authenticated user.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/tasks` | Get all tasks (supports `?status=`, `?search=`, `?projectId=`, `?categoryId=`, `?priority=`, `?tagIds=` filters) |
| `POST` | `/api/tasks` | Create a task. Validates project membership before inserting. |
| `GET` | `/api/tasks/:id` | Get a single task by ID |
| `PATCH` | `/api/tasks/:id` | Update title, description, status, priority, categoryId |
| `DELETE` | `/api/tasks/:id` | Delete a specific task |
| `DELETE` | `/api/tasks` | Bulk delete. Optional `?status=` to scope deletion. |
| `GET` | `/api/tasks/:id/history` | Audit log entries for a task (chronological change history) |
| `GET` | `/api/tasks/export/pdf` | Generate and download a PDF of the current user''s tasks |

### Projects — `/api/projects`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/projects` | Get all projects the user owns or is a member of |
| `POST` | `/api/projects` | Create a new project (creator becomes OWNER) |
| `PATCH` | `/api/projects/:id` | Rename or change settings (OWNER only) |
| `DELETE` | `/api/projects/:id` | Delete project and all its tasks (OWNER only) |
| `POST` | `/api/projects/:id/join` | Join a public project as MEMBER. Notifies OWNER by email. |
| `DELETE` | `/api/projects/:id/leave` | Leave a project (MEMBER only — OWNER must delete instead) |
| `GET` | `/api/projects/:id/members` | List all members with their roles |
| `POST` | `/api/projects/:id/members` | Add a user by email (OWNER only). Sends invitation email. |
| `DELETE` | `/api/projects/:id/members/:userId` | Remove a member (OWNER only) |

### Categories — `/api/categories`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/categories` | Get all categories (optionally `?projectId=`) |

### Tags — `/api/tags`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/tags` | Get all tags for a project (`?projectId=` required) |
| `POST` | `/api/tags` | Create a tag in a project |
| `DELETE` | `/api/tags/:id` | Delete a tag |
| `POST` | `/api/tags/tasks/:taskId` | Assign a tag to a task |
| `DELETE` | `/api/tags/tasks/:taskId/:tagId` | Remove a tag from a task |

### Admin — `/api/admin` *(ADMIN role required)*

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/admin/users` | All users with per-user task statistics |
| `PATCH` | `/api/admin/users/:id/role` | Promote to ADMIN or demote to USER |
| `GET` | `/api/admin/export/pdf` | Download a PDF of all users and their stats |

---

## Local Development Setup

> **Prerequisite:** Docker Desktop must be running to start PostgreSQL and RabbitMQ.

### 1. Start the infrastructure (from project root)

```bash
docker-compose up -d db rabbitmq
```

### 2. Configure environment variables

```bash
cp ../.env.example .env
```

Edit `backend/.env`. **Important:** change `DB_HOST` to `127.0.0.1` (not `db`) since the API runs directly on your machine, not inside Docker.

```env
JWT_SECRET=replace_with_a_strong_random_secret_32chars_minimum
DB_HOST=127.0.0.1
DB_USER=postgres
DB_PASSWORD=change_me
DB_NAME=tasks_db
RABBITMQ_URL=amqp://admin:change_me@localhost:5672

# Email — leave empty in dev to use Ethereal (auto-generated test account)
# For Gmail: SMTP_HOST=smtp.gmail.com  SMTP_PORT=587  SMTP_SECURE=false
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Task Manager <noreply@taskmanager.dev>"
```

> **Never commit `.env`** — it is in `.gitignore`. Only `.env.example` is tracked.

### 3. Install dependencies

```bash
npm install
```

### 4. Run database migrations

Creates all tables (`users`, `tasks`, `projects`, `project_members`, `categories`, `tags`, `task_tags`, `audit_logs`):

```bash
npm run db:migrate
```

### 5. Seed default data

```bash
npm run db:seed
```

Creates **17 users** and **1 500 tasks** distributed round-robin across users and split evenly across statuses:

| Email | Password | Role |
| --- | --- | --- |
| `admin@test.com` | `AdminPassword123!` | ADMIN |
| `user@test.com` | `123456J` | USER |
| `user1@test.com` … `user15@test.com` | `123456J` | USER |

> Running the seed again is safe — it truncates all tasks and users first to avoid duplicate key errors.

### 6. Start the API

```bash
npm run dev
```

- API: **<http://localhost:3000>**
- Swagger UI: **<http://localhost:3000/api-docs>**

### 7. Start the async worker (optional — second terminal)

Consumes messages from the `task_notifications` and `audit_events` RabbitMQ queues and sends emails:

```bash
npx tsx src/worker.ts
```

If `SMTP_HOST` is empty, the worker creates an Ethereal test account automatically and logs a preview URL for each email sent.

---

## Database Scripts

| Command | Description |
| --- | --- |
| `npm run db:migrate` | Apply all pending migrations |
| `npm run db:rollback` | Revert the last migration batch |
| `npm run db:seed` | Re-seed users + tasks (destructive — truncates first) |

---

## Running Tests

Tests use Node.js''s built-in test runner (`node:test`) — no Jest required.

```bash
npm test
```

Expected output: **13 tests, 0 failures** across 3 suites:

| Suite | File | What it covers |
| --- | --- | --- |
| AuthService | `auth.service.test.ts` | Login validation, registration, JWT generation |
| TaskService | `task.service.test.ts` | CRUD validation, user isolation, messaging integration |
| Security | `security.test.ts` | Cross-user access prevention, ID spoofing |

Tests run against `.env.test` (included in the repo). No real database or RabbitMQ connection is made — all DAOs are mocked via dependency injection.

---

## Database Schema

```text
users
  id            uuid  PK
  email         varchar  UNIQUE NOT NULL
  password      varchar  NOT NULL  (bcrypt)
  role          varchar  DEFAULT ''USER''  (''USER'' | ''ADMIN'')
  name          varchar  nullable
  lang          varchar  DEFAULT ''en''  (''en'' | ''es'')
  createdAt     timestamp

projects
  id            uuid  PK
  name          varchar  NOT NULL
  ownerId       uuid  FK → users(id)
  isPublic      boolean  DEFAULT false
  color         varchar  nullable
  createdAt     timestamp

project_members
  projectId     uuid  FK → projects(id)  CASCADE DELETE
  userId        uuid  FK → users(id)     CASCADE DELETE
  role          varchar  (''OWNER'' | ''MEMBER'')
  PRIMARY KEY (projectId, userId)

categories
  id            uuid  PK
  name          varchar  NOT NULL
  projectId     uuid  FK → projects(id)  nullable

tasks
  id            uuid  PK
  title         varchar  NOT NULL
  description   text
  status        varchar  DEFAULT ''PENDING''  (''PENDING'' | ''IN_PROGRESS'' | ''COMPLETED'')
  priority      varchar  DEFAULT ''MEDIUM''   (''LOW'' | ''MEDIUM'' | ''HIGH'' | ''URGENT'')
  userId        uuid  NOT NULL  FK → users(id)  CASCADE DELETE
  projectId     uuid  nullable  FK → projects(id)
  categoryId    uuid  nullable  FK → categories(id)
  createdAt     timestamp
  updatedAt     timestamp nullable

tags
  id            uuid  PK
  name          varchar  NOT NULL
  color         varchar  nullable
  projectId     uuid  FK → projects(id)  CASCADE DELETE

task_tags
  taskId        uuid  FK → tasks(id)  CASCADE DELETE
  tagId         uuid  FK → tags(id)   CASCADE DELETE
  PRIMARY KEY (taskId, tagId)

audit_logs
  id            uuid  PK
  taskId        uuid  FK → tasks(id)  CASCADE DELETE
  userId        uuid  FK → users(id)
  action        varchar  (''TASK_CREATED'' | ''TASK_UPDATED'' | ''TASK_COMPLETED'' | ''TASK_DELETED'')
  oldValue      jsonb  nullable
  newValue      jsonb  nullable
  createdAt     timestamp
```

---

## Key Design Decisions

| Decision | Rationale |
| --- | --- |
| **Result Pattern** | Every service method returns `Result<T>`. Controllers map failure codes to HTTP status codes — no unhandled exceptions leak to the HTTP layer. |
| **DAO → Service → Controller** | Strict separation. DAOs only touch the DB. Services only call DAOs. Controllers only call Services. |
| **Dependency injection in services** | `TaskService` accepts `dao` and `messaging` as constructor arguments, making it fully testable without a real database or RabbitMQ. |
| **httpOnly cookie auth** | JWT stored in an httpOnly cookie (not localStorage) to prevent XSS token theft. Frontend Axios uses `withCredentials: true`. |
| **Fire-and-forget notifications** | Email triggers (project join, task assignment) are dispatched via RabbitMQ without blocking the HTTP response. The worker processes them asynchronously. |
| **Project membership guard** | `task.service.ts` calls `projectDAO.getMemberRole()` before creating a task — returns `notProjectMember` if the user has no role in the target project. |
| **Rate limiting on auth routes** | `express-rate-limit` caps login at 10 req/15 min and registration at 5 req/hour to mitigate brute-force attacks. |
| **Zero-any TypeScript policy** | No `any` types in service or DAO layers. Workarounds use `unknown` + type narrowing. |
