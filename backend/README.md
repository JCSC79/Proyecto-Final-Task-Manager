# Task Manager — Backend

REST API built with **Node.js 24**, **Express 5**, **TypeScript** (strict / zero-any), **PostgreSQL 15**, **RabbitMQ**, and **Socket.IO**. Implements JWT authentication (httpOnly cookie), RBAC, Yup validation, the Result Pattern, async email notifications, and real-time WebSocket events.

> This README covers the backend in isolation. For the full project setup see the [root README](../README.md).

---

## Architecture

```text
src/
├── server.ts               Express app + Socket.IO initialisation
├── worker.ts               RabbitMQ consumer — sends emails from queued events
├── config/swagger.ts       OpenAPI 3.0 spec (served at /api-docs)
├── controllers/            HTTP layer
│   ├── auth.controller.ts
│   ├── task.controller.ts
│   ├── project.controller.ts
│   ├── comment.controller.ts
│   ├── category.controller.ts
│   ├── tag.controller.ts
│   └── admin.controller.ts
├── services/               Business logic
│   ├── auth.service.ts
│   ├── task.service.ts
│   ├── messaging.service.ts  RabbitMQ producer
│   ├── email.service.ts
│   ├── pdf.service.ts
│   ├── socket.service.ts   Socket.IO singleton — broadcasts real-time events
│   └── *.test.ts           Unit tests (12 passing)
├── daos/                   Database access (Knex)
│   ├── user.dao.ts
│   ├── task.dao.ts
│   ├── project.dao.ts
│   ├── comment.dao.ts
│   ├── audit.dao.ts        getLeadTimesByCategory · getWorkloadByUser
│   ├── category.dao.ts
│   └── tag.dao.ts
├── middlewares/
│   ├── auth.middleware.ts  JWT guard + is_blocked check
│   └── admin.middleware.ts RBAC guard
├── models/                 TypeScript interfaces
├── routes/                 Express routers (+ comment.routes.ts)
├── schemas/                Yup validation
├── templates/              HTML email templates (bilingual EN/ES)
├── db/
│   ├── migrations/         Knex migrations
│   └── seeds/              Dev seed data
└── utils/result.ts         Result<T, E> pattern
```

---

## API Endpoints

All endpoints except `/api/auth/*` and `/health` require a valid JWT (httpOnly cookie).

### Auth — `/api/auth`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | ✗ | Create account. Rate-limited: 5 req/hour. |
| `POST` | `/api/auth/login` | ✗ | Set httpOnly JWT cookie. Rate-limited: 10 req/15 min. |
| `POST` | `/api/auth/logout` | ✓ | Clear auth cookie. |
| `PATCH` | `/api/auth/me` | ✓ | Update display name. |

### Tasks — `/api/tasks`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/tasks` | All visible tasks (own + project member tasks) |
| `POST` | `/api/tasks` | Create a task |
| `GET` | `/api/tasks/:id` | Get a single task |
| `PATCH` | `/api/tasks/:id` | Update (title, description, status, priority, categoryId) |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `DELETE` | `/api/tasks` | Bulk delete (optional `?status=` filter) |
| `GET` | `/api/tasks/:id/history` | Audit log for a task |
| `GET` | `/api/tasks/export/pdf` | Download tasks as PDF |
| `GET` | `/api/tasks/:id/comments` | List comments (project members only) |
| `POST` | `/api/tasks/:id/comments` | Post a comment + broadcast via Socket.IO |
| `DELETE` | `/api/tasks/:id/comments/:commentId` | Delete own comment |

### Projects — `/api/projects`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/projects` | All projects visible to user |
| `POST` | `/api/projects` | Create a project |
| `PATCH` | `/api/projects/:id` | Rename (OWNER only) |
| `DELETE` | `/api/projects/:id` | Delete project + CASCADE (OWNER only) |
| `GET` | `/api/projects/:id/summary` | Task count + member count |
| `POST` | `/api/projects/:id/join` | Join as MEMBER |
| `DELETE` | `/api/projects/:id/leave` | Leave project |
| `GET` | `/api/projects/:id/members` | List members |
| `POST` | `/api/projects/:id/members` | Add member by email (OWNER only) |
| `DELETE` | `/api/projects/:id/members/:userId` | Remove member (OWNER only) |
| `PATCH` | `/api/projects/:id/settings` | Update isPublic / color / description |

### Admin — `/api/admin` *(ADMIN role required)*

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/admin/users` | All users with task statistics |
| `PATCH` | `/api/admin/users/:id/role` | Promote / demote |
| `PATCH` | `/api/admin/users/:id/block` | Block / unblock (immediate next-request expiry) |
| `DELETE` | `/api/admin/users/:id` | Delete user (CASCADE on all data) |
| `GET` | `/api/admin/analytics` | Lead times by category + workload by user (`?range=7\|30\|90\|all`) |
| `GET` | `/api/admin/export/pdf` | Download admin report as PDF |

### System

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | X | `{ status: "ok" }` — Docker healthcheck |

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

Creates all tables (`users`, `categories`, `projects`, `project_settings`, `project_members`, `tags`, `tasks`, `task_tags`, `task_assignees`, `comments`, `audit_logs`):

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

Expected output: **25 tests, 0 failures** across 5 suites:

| Suite | File | What it covers |
| --- | --- | --- |
| AuthService | `auth.service.test.ts` | Login validation, registration, JWT generation |
| TaskService | `task.service.test.ts` | CRUD validation, user isolation, messaging integration |
| Security | `security.test.ts` | Cross-user access prevention, ID spoofing |
| Template | `taskNotification.template.test.ts` | Email HTML rendering (bilingual) |
| Schema | (additional validation tests) | Yup schema edge cases |

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
  userId        uuid  FK → users(id)  CASCADE DELETE   (creator / original owner)
  createdAt     timestamp

project_settings                                        (1:1 with projects — PK = FK)
  projectId     uuid  PK  FK → projects(id)  CASCADE DELETE
  description   text  nullable
  color         varchar(7)  DEFAULT '#4c90f0'           (hex color for UI chip)
  isPublic      boolean  DEFAULT true
  createdAt     timestamp

project_members
  userId        uuid  FK → users(id)     CASCADE DELETE
  projectId     uuid  FK → projects(id)  CASCADE DELETE
  role          varchar  (''OWNER'' | ''MEMBER'')
  joinedAt      timestamp
  PRIMARY KEY (userId, projectId)

categories                                              (global reference table — no FK)
  id            uuid  PK
  name          varchar(50)  UNIQUE NOT NULL
  color         varchar(7)  NOT NULL                    (hex color for badge)
  createdAt     timestamp

tags
  id            uuid  PK
  name          varchar(50)  NOT NULL
  color         varchar(7)  DEFAULT '#8a9ba8'
  projectId     uuid  NOT NULL  FK → projects(id)  CASCADE DELETE
  createdAt     timestamp

tasks
  id            uuid  PK
  title         varchar  NOT NULL
  description   text  nullable
  status        varchar  DEFAULT ''PENDING''  (''PENDING'' | ''IN_PROGRESS'' | ''COMPLETED'')
  priority      varchar  nullable              (''LOW'' | ''MEDIUM'' | ''HIGH'' | ''URGENT'')
  dueDate       date  nullable                          (YYYY-MM-DD, no time component)
  userId        uuid  NOT NULL  FK → users(id)      CASCADE DELETE
  projectId     uuid  nullable  FK → projects(id)   CASCADE DELETE
  categoryId    uuid  nullable  FK → categories(id) SET NULL
  createdAt     timestamp
  updatedAt     timestamp  nullable

task_tags
  taskId        uuid  FK → tasks(id)  CASCADE DELETE
  tagId         uuid  FK → tags(id)   CASCADE DELETE
  PRIMARY KEY (taskId, tagId)

task_assignees
  taskId        uuid  FK → tasks(id)  CASCADE DELETE
  userId        uuid  FK → users(id)  CASCADE DELETE
  PRIMARY KEY (taskId, userId)

comments
  id            uuid  PK
  taskId        uuid  FK → tasks(id)  CASCADE DELETE
  userId        uuid  FK → users(id)  CASCADE DELETE
  body          text  NOT NULL                          (CommonMark Markdown)
  createdAt     timestamp

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
