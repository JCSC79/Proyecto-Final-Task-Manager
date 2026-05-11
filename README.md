# Gestor de Tareas — Full-Stack Task Manager

A full-stack task management application with JWT authentication, role-based access control (RBAC), real-time KPI analytics, and an admin panel. Designed to run with a single Docker Compose command or in local development mode.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Backend** | Node.js 24, Express 5, TypeScript (strict), Knex 3, PostgreSQL 15 |
| **Auth** | JWT (httpOnly cookie) + bcrypt |
| **Messaging** | RabbitMQ 3 (amqplib) — async task notifications |
| **Frontend** | React 19, Vite 7, TypeScript, BlueprintJS v6, TanStack Query v5 |
| **Charts** | Recharts |
| **i18n** | react-i18next (English / Spanish) |
| **Containers** | Docker + Docker Compose |

---

## Feature Overview

| Area | What's included |
| --- | --- |
| **Auth** | Login · registration · JWT (httpOnly cookie) · PATCH `/api/auth/me` |
| **Tasks** | Full CRUD · status workflow (Pending → In Progress → Completed) · bulk delete |
| **Dashboard** | KPI cards · status donut chart · workload bar chart · trend line chart |
| **Admin panel** | User list · per-user task stats · promote / demote roles |
| **UI/UX** | Dark / Light theme · EN / ES i18n · Gravatar avatar · responsive layout |
| **Security** | Rate limiting on auth routes · CORS · RBAC middleware · Yup input validation |
| **API Docs** | Swagger UI at `/api-docs` |

---

## Project Structure

```text
.
├── docker-compose.yml       # Orchestrates all 4 services
├── .env.example             # Environment variable template — copy to .env
├── backend/                 # Node.js REST API
│   ├── src/
│   │   ├── server.ts        # Express entry point
│   │   ├── controllers/     # HTTP layer
│   │   ├── services/        # Business logic + tests
│   │   ├── daos/            # Database access (Knex)
│   │   ├── middlewares/     # JWT guard, RBAC guard
│   │   ├── models/          # TypeScript interfaces
│   │   ├── routes/          # Express Router definitions
│   │   ├── schemas/         # Yup validation schemas
│   │   ├── db/
│   │   │   ├── migrations/  # Knex migration files
│   │   │   └── seeds/       # Default users + stress-test tasks
│   │   └── utils/           # Result<T> pattern
│   ├── Dockerfile
│   └── package.json
└── frontend/                # React SPA
    ├── src/
    │   ├── pages/           # Route-level components
    │   ├── components/      # Reusable UI components
    │   ├── api/             # Axios instance + endpoint calls
    │   ├── contexts/        # Auth + Theme React contexts
    │   ├── hooks/           # Custom hooks
    │   ├── styles/          # CSS Design Tokens + Blueprint overrides
    │   └── types/           # Shared TypeScript types
    ├── Dockerfile
    └── package.json
```

---

## Prerequisites

| Tool | Minimum version | Notes |
| --- | --- | --- |
| Docker Desktop | Any recent | [docker.com](https://www.docker.com/products/docker-desktop/) — needed for both modes |
| Node.js | 18 LTS (v24 recommended) | Only required for local dev mode |
| npm | 9+ | Bundled with Node |
| Git | Any | |

---

## Option A — Docker Compose (recommended, single command)

The fastest way to run the full stack. Everything — API, frontend, database, and message broker — starts together.

### 1. Clone and configure

```bash
git clone https://github.com/JCSC79/proyecto-backend-fase1.git
cd proyecto-backend-fase1
```

Copy the environment template and fill in your own values:

```bash
cp .env.example .env
```

Open `.env` and set **at minimum** a strong `JWT_SECRET`:

```env
# .env — never commit this file
JWT_SECRET=replace_with_a_strong_random_secret_32chars_minimum

# PostgreSQL — used by both Docker Compose and the API container
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me
POSTGRES_DB=tasks_db

DB_HOST=db
DB_USER=postgres
DB_PASSWORD=change_me
DB_NAME=tasks_db

# RabbitMQ
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=change_me
RABBITMQ_URL=amqp://admin:change_me@rabbitmq:5672
```

> `DB_HOST=db` is the internal Docker Compose service name — keep it as `db` when running containers.

### 2. Start everything

```bash
docker-compose up -d
```

Docker will build the backend and frontend images on the first run (takes ~1–2 min). After that it starts:

| Container | Description | Port |
| --- | --- | --- |
| `postgres_db` | PostgreSQL 15 | 5432 |
| `rabbitmq_broker` | RabbitMQ + management UI | 5672 / 15672 |
| `task_api` | Express REST API | 3000 |
| `task_frontend` | React SPA served by Nginx | 5173 |

### 3. Initialize the database (first time only)

```bash
docker exec task_api npm run db:migrate
docker exec task_api npm run db:seed
```

The seed creates **17 users** and **1500 tasks** for testing:

| Email | Password | Role | Notes |
| --- | --- | --- | --- |
| `admin@test.com` | `AdminPassword123!` | ADMIN | Main admin account |
| `user@test.com` | `123456J` | USER | Main regular account |
| `user1@test.com` … `user15@test.com` | `123456J` | USER | Stress-test accounts |

The 1500 tasks are distributed round-robin across all 17 users, split evenly across `PENDING` / `IN_PROGRESS` / `COMPLETED` — used to stress-test pagination, charts, and the admin panel.

> Change these passwords before any public deployment.

### 4. Open the app

| URL | Description |
| --- | --- |
| <http://localhost:5173> | Web application |
| <http://localhost:3000/api-docs> | Swagger / OpenAPI docs |
| <http://localhost:15672> | RabbitMQ management (admin / change_me) |

---

## Option B — Local Development Mode

Runs the API and frontend directly on your machine with hot-reload. Requires the database and RabbitMQ to run via Docker.

### 1. Start only the infrastructure services

```bash
docker-compose up -d db rabbitmq
```

### 2. Configure the backend

```bash
cd backend
cp ../.env.example .env   # or create backend/.env manually
```

Edit `backend/.env` — note that `DB_HOST` must be `127.0.0.1` (not `db`) when running outside Docker:

```env
JWT_SECRET=replace_with_a_strong_random_secret_32chars_minimum
DB_HOST=127.0.0.1
DB_USER=postgres
DB_PASSWORD=change_me
DB_NAME=tasks_db
RABBITMQ_URL=amqp://admin:change_me@localhost:5672
```

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev          # API on http://localhost:3000
```

### 3. Start the frontend (new terminal)

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev          # App on http://localhost:5173
```

> `--legacy-peer-deps` is required because some BlueprintJS peer dependencies haven't declared support for React 19 yet.

---

## Running the Tests

**Frontend** (Vitest — 27 tests):

```bash
cd frontend
npx vitest run
```

**Backend** (Node.js built-in test runner — 13 tests):

```bash
cd backend
npm test
```

> Backend tests use `.env.test` (included in the repo) which provides dummy credentials so no real database connection is needed.

---

## Docker Management Cheat-Sheet

| Action | Command |
| --- | --- |
| Stop all (preserve data) | `docker-compose stop` |
| Start again | `docker-compose start` |
| Full teardown (wipe volumes) | `docker-compose down -v` |
| View API logs live | `docker-compose logs -f api` |
| Rebuild after code change | `docker-compose build api && docker-compose up -d api` |
| Rebuild frontend | `docker-compose build frontend && docker-compose up -d frontend` |
| Re-run migrations in container | `docker exec task_api npm run db:migrate` |

---

## Environment Variable Reference

The table below covers every variable used by the stack. All values live in a single `.env` at the project root (never commit it — it is in `.gitignore`).

| Variable | Used by | Description |
| --- | --- | --- |
| `JWT_SECRET` | API | Secret for signing JWT tokens. Min 32 characters. |
| `DB_HOST` | API | `db` in Docker, `127.0.0.1` in local dev |
| `DB_USER` | API + Compose | PostgreSQL user |
| `DB_PASSWORD` | API + Compose | PostgreSQL password |
| `DB_NAME` | API + Compose | PostgreSQL database name |
| `POSTGRES_USER` | Compose | Same as `DB_USER` — initialises the DB container |
| `POSTGRES_PASSWORD` | Compose | Same as `DB_PASSWORD` |
| `POSTGRES_DB` | Compose | Same as `DB_NAME` |
| `RABBITMQ_DEFAULT_USER` | Compose | RabbitMQ admin user |
| `RABBITMQ_DEFAULT_PASS` | Compose | RabbitMQ admin password |
| `RABBITMQ_URL` | API | Full AMQP connection string |

See `.env.example` at the project root for a ready-to-copy template.
