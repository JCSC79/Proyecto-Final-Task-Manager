# Task Manager — Backend

REST API built with **Node.js 24**, **Express 5**, **TypeScript** (strict / zero-any), **PostgreSQL 15**, and **RabbitMQ**. Implements JWT authentication, role-based access control (RBAC), and the Result Pattern throughout.

---

## Architecture

```src/
├── server.ts             Express app entry point, route mounting
├── worker.ts             RabbitMQ consumer (runs separately)
├── config/
│   └── swagger.ts        OpenAPI 3.0 spec
├── controllers/          HTTP layer — validates input, delegates to services
│   ├── auth.controller.ts
│   ├── task.controller.ts
│   └── admin.controller.ts
├── services/             Business logic
│   ├── auth.service.ts   JWT generation, bcrypt, user registration
│   ├── task.service.ts
│   └── messaging.service.ts  RabbitMQ producer
├── daos/                 Database access objects (Knex queries)
│   ├── user.dao.ts
│   └── task.dao.ts
├── middlewares/
│   ├── auth.middleware.ts    authenticateToken (JWT guard)
│   └── admin.middleware.ts   requireAdmin (RBAC guard)
├── models/               TypeScript interfaces
├── routes/               Express Router definitions
│   ├── auth.routes.ts
│   └── admin.routes.ts
├── schemas/              Yup validation schemas
├── db/
│   ├── migrations/       Knex migration files
│   └── seeds/            Seed data (users + tasks)
└── utils/
    └── result.ts         Result<T> pattern
```

---

## API Endpoints

### Auth — `/api/auth`  *(public)*

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/login` | Login. Returns `{ token, user }` |
| POST | `/api/auth/register` | Self-register. Returns `{ token, user }` |
| PATCH | `/api/auth/me` | Update display name *(requires token)* |

### Tasks — `/tasks`  *(requires token)*

| Method | Path | Description |
| --- | --- | --- |
| GET | `/tasks` | Get all tasks for the logged-in user |
| POST | `/tasks` | Create a task |
| PATCH | `/tasks/:id` | Update title, description, or status |
| DELETE | `/tasks/:id` | Delete a specific task |
| DELETE | `/tasks` | Delete all tasks (clear board) |

### Admin — `/api/admin`  *(requires token + ADMIN role)*

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/admin/users` | All users with per-user task statistics |
| PATCH | `/api/admin/users/:id/role` | Promote or demote a user |

---

## Local Development Setup

### 1. Infrastructure (Docker)

From the **project root** (not this folder):

```docker-compose up -d db rabbitmq```

### 2. Environment variables

```cp .env.example .env```

Edit `.env` — at minimum set a strong `JWT_SECRET`:

```env
JWT_SECRET=any_random_string_at_least_32_chars
RABBITMQ_URL=amqp://JC:abc123..@localhost:5672
DB_HOST=127.0.0.1
DB_USER=postgres
DB_PASSWORD=abc123..
DB_NAME=tasks_db
```

> **Never commit `.env`** — it is in `.gitignore`. Only `.env.example` is tracked.

### 3. Install dependencies

```npm install```

### 4. Run migrations

Creates the `users` and `tasks` tables:

```npm run db:migrate```

### 5. Seed default users

Creates two accounts for testing:

```npm run db:seed```

| Email | Password | Role |
| --- | --- | --- |
| `admin@test.com` | AdminPassword123! | ADMIN |
| `user@test.com` | UserPassword123! | USER |

> Running the seed again is safe — it clears users first to avoid duplicate key errors.  
> **Change these passwords** before any production deployment.

### 6. Start the API

```npm run dev```

API available at **<http://localhost:3000>**

### 7. (Optional) Start the async worker

In a separate terminal, to process RabbitMQ task notifications:

```npx tsx src/worker.ts```

---

## Database Management Scripts

```npm run db:migrate```    # Apply all pending migrations
```npm run db:rollback```   # Revert the last migration batch
```npm run db:seed```       # Re-seed users (clears existing users first)

---

## Running inside Docker (full stack)

From the project root:

```docker-compose build api```       # Build the API image
```docker-compose up -d```           # Start everything
```docker exec task_api npm run db:migrate```
```docker exec task_api npm run db:seed```

After any backend code change, rebuild:

```docker-compose build api && docker-compose up -d api```

---

## Interactive API Docs

Swagger UI: **<http://localhost:3000/api-docs>**

---

## Key Design Decisions

- **Result Pattern** — every service method returns `Result<T>` instead of throwing. Controllers check `result.isFailure` and map to the correct HTTP status code.
- **exactOptionalPropertyTypes: true** — optional fields must use spread `...(value ? { field: value } : {})` instead of `field: value ?? undefined`.
- **Express 5** — `app.use()` + `app.get()` mixing on the same path is unreliable; all sub-routes use dedicated `Router` instances.
- **Rate limiting** — `/api/auth/login` is capped at 10 requests / 15 min via `express-rate-limit`.
