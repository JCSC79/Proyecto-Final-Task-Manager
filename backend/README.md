# Task Manager — Backend

REST API built with **Node.js 24**, **Express 5**, **TypeScript** (strict / zero-any), **PostgreSQL 15**, and **RabbitMQ**. Implements JWT authentication (httpOnly cookie), role-based access control (RBAC), Yup input validation, and the Result Pattern throughout.

> This README covers the backend in isolation. For the full project setup (Docker Compose, environment variables, frontend) see the [root README](../README.md).

---

## Architecture

```text
src/
├── server.ts               Express app — middleware stack + route mounting
├── worker.ts               RabbitMQ consumer (optional, runs separately)
├── config/
│   └── swagger.ts          OpenAPI 3.0 spec (served at /api-docs)
├── controllers/            HTTP layer — parse request, call service, return response
│   ├── auth.controller.ts
│   ├── task.controller.ts
│   └── admin.controller.ts
├── services/               Business logic — framework-agnostic
│   ├── auth.service.ts     JWT generation, bcrypt hashing, user registration
│   ├── task.service.ts     Task CRUD with per-user isolation
│   ├── messaging.service.ts  RabbitMQ producer (fire-and-forget notifications)
│   ├── auth.service.test.ts
│   ├── task.service.test.ts
│   └── security.test.ts
├── daos/                   Data Access Objects — all Knex queries here
│   ├── user.dao.ts
│   └── task.dao.ts
├── middlewares/
│   ├── auth.middleware.ts  JWT guard (authenticateToken)
│   └── admin.middleware.ts RBAC guard (requireAdmin)
├── models/                 TypeScript interfaces (IUser, ITask)
├── routes/                 Express Router definitions
│   ├── auth.routes.ts
│   └── admin.routes.ts
├── schemas/                Yup validation schemas
│   ├── task.schema.ts
│   └── user.schema.ts
├── db/
│   ├── migrations/         Knex migration files (applied in order)
│   └── seeds/              Default users + stress-test task dataset
└── utils/
    └── result.ts           Generic Result<T> pattern
```

---

## API Endpoints

### Auth — `/api/auth` *(public)*

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create a new USER account. Returns `{ token, user }`. Rate limited: 5 req / hour. |
| `POST` | `/api/auth/login` | Validate credentials. Returns `{ token, user }` + sets httpOnly cookie. Rate limited: 10 req / 15 min. |
| `POST` | `/api/auth/logout` | Clears the auth cookie. |
| `PATCH` | `/api/auth/me` | Update the authenticated user's display name. Requires token. |

### Tasks — `/api/tasks` *(JWT required)*

All task endpoints are scoped to the authenticated user — users can only access their own tasks.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/tasks` | Get all tasks for the logged-in user |
| `POST` | `/api/tasks` | Create a new task |
| `GET` | `/api/tasks/:id` | Get a single task by ID |
| `PATCH` | `/api/tasks/:id` | Update title, description, or status |
| `DELETE` | `/api/tasks/:id` | Delete a specific task |
| `DELETE` | `/api/tasks` | Bulk delete. Optional `?status=COMPLETED` to delete only by status. |

### Admin — `/api/admin` *(JWT + ADMIN role required)*

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/admin/users` | All users with per-user task statistics |
| `PATCH` | `/api/admin/users/:id/role` | Promote a user to ADMIN or demote to USER |

---

## Local Development Setup

> **Prerequisite:** Docker Desktop must be running to start the database and RabbitMQ.

### 1. Start the infrastructure

From the **project root**:

```bash
docker-compose up -d db rabbitmq
```

### 2. Configure environment variables

```bash
cp ../.env.example .env
```

Edit `backend/.env` and make sure `DB_HOST` is `127.0.0.1` (not `db`), since the API runs directly on your machine:

```env
JWT_SECRET=replace_with_a_strong_random_secret_32chars_minimum
DB_HOST=127.0.0.1
DB_USER=postgres
DB_PASSWORD=change_me
DB_NAME=tasks_db
RABBITMQ_URL=amqp://admin:change_me@localhost:5672
```

> **Never commit `.env`** — it is in `.gitignore`. Only `.env.example` is tracked.

### 3. Install dependencies

```bash
npm install
```

### 4. Run database migrations

Creates the `users` and `tasks` tables:

```bash
npm run db:migrate
```

### 5. Seed default data

Runs two seed files in order: first users, then tasks:

```bash
npm run db:seed
```

This creates **17 users** and **1500 tasks** distributed among them (round-robin):

| Email | Password | Role | Notes |
| --- | --- | --- | --- |
| `admin@test.com` | `AdminPassword123!` | ADMIN | Main admin account |
| `user@test.com` | `123456J` | USER | Main regular account |
| `user1@test.com` … `user15@test.com` | `123456J` | USER | Stress-test accounts |

The 1500 tasks are split evenly across the three statuses (`PENDING` / `IN_PROGRESS` / `COMPLETED`) and spread across the 17 users — ideal for testing pagination, charts, and the admin dashboard.

> Running the seed again is safe — it wipes all tasks and users first to avoid duplicate key errors.

### 6. Start the development server

```bash
npm run dev
```

API is available at **<http://localhost:3000>**  
Swagger UI is available at **<http://localhost:3000/api-docs>**

### 7. (Optional) Start the async worker

In a separate terminal, to process RabbitMQ task notifications:

```bash
npx tsx src/worker.ts
```

---

## Database Scripts

| Script | Command | Description |
| --- | --- | --- |
| Migrate | `npm run db:migrate` | Apply all pending migrations |
| Rollback | `npm run db:rollback` | Revert the last migration batch |
| Seed | `npm run db:seed` | Re-seed default users + tasks (destructive) |

---

## Running Tests

Tests use Node.js's built-in test runner (`node:test`) — no Jest required.

```bash
npm test
```

Expected output: **13 tests, 0 failures** across 3 suites:

| Suite | File | Coverage |
| --- | --- | --- |
| AuthService | `auth.service.test.ts` | Login validation, registration, JWT generation |
| TaskService | `task.service.test.ts` | CRUD validation, user isolation, messaging |
| Security | `security.test.ts` | Cross-user access prevention, ID spoofing |

Tests run against a **dummy environment** defined in `.env.test` — no real database connection is made. All DAOs are mocked via dependency injection.

---

## Database Schema

```text
users
  id          uuid  PK
  email       varchar  UNIQUE NOT NULL
  password    varchar  NOT NULL  (bcrypt hashed)
  role        varchar  DEFAULT 'USER'  ('USER' | 'ADMIN')
  name        varchar  nullable
  avatar_url  varchar  nullable
  createdAt   timestamp

tasks
  id          uuid  PK
  title       varchar  NOT NULL
  description text
  status      varchar  DEFAULT 'PENDING'  ('PENDING' | 'IN_PROGRESS' | 'COMPLETED')
  userId      uuid  NOT NULL  FK → users(id)  CASCADE DELETE
  projectId   uuid  nullable  FK → (future projects table)
  createdAt   timestamp
  updatedAt   timestamp  nullable
```

> `projectId` is present in the schema and nullable — it is the prepared extension point for Phase 2 (Projects feature).

---

## Key Design Decisions

| Decision | Rationale |
| --- | --- |
| **Result Pattern** | Every service method returns `Result<T>` instead of throwing. Controllers check `result.isFailure` and map to the correct HTTP status code. No unhandled exceptions leak to the HTTP layer. |
| **DAO → Service → Controller** | Strict separation. DAOs only talk to the DB. Services only talk to DAOs. Controllers only talk to Services. |
| **Dependency injection in TaskService** | `TaskService` accepts `dao` and `messaging` as constructor arguments, making it fully testable without a real database or RabbitMQ. |
| **httpOnly cookie auth** | The JWT is stored in an httpOnly cookie (not localStorage) to prevent XSS token theft. The Axios instance on the frontend uses `withCredentials: true`. |
| **Rate limiting on auth routes** | `express-rate-limit` caps login at 10 req/15 min and registration at 5 req/hour to mitigate brute-force attacks. |
| **Zero-any TypeScript policy** | No `any` types in service or DAO layers. Workarounds use `unknown` + type narrowing. |
