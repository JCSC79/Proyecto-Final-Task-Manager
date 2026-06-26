# Gestor de Tareas — Full-Stack Task Manager

A full-stack task management application with JWT authentication, role-based access control (RBAC), project workspaces, kanban board with drag-and-drop, real-time KPI analytics, async email notifications, and an admin panel. Runs with a single Docker Compose command or in local development mode.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Backend** | Node.js 24, Express 5, TypeScript (strict), Knex 3, PostgreSQL 15 |
| **Auth** | JWT (httpOnly cookie) + bcrypt |
| **Messaging** | RabbitMQ 3 (amqplib) — async task & project notifications |
| **Email** | Nodemailer — Ethereal (dev) / SMTP (prod) |
| **Frontend** | React 19, Vite 7, TypeScript, BlueprintJS v6, TanStack Query v5 |
| **Charts** | Recharts |
| **i18n** | react-i18next (English / Spanish) |
| **Containers** | Docker + Docker Compose |

---

## Feature Overview

| Area | What''s included |
| --- | --- |
| **Auth** | Login · Registration · JWT (httpOnly cookie) · Update display name |
| **Projects** | Create / rename / delete workspaces · Public join / leave · Member management · Owner notifications by email |
| **Tasks** | Full CRUD · Status workflow (Pending → In Progress → Completed) · Priority levels · Categories · Tags · Bulk delete · Drag-and-drop between columns · PDF export |
| **Audit history** | Per-task change log — who changed what and when |
| **Dashboard** | KPI cards · Status donut chart · Workload bar chart · Trend line chart · PDF export |
| **Admin panel** | User list · Per-user task stats · Promote / demote roles · PDF export |
| **Notifications** | Email on task assignment · Email when a member joins a project (owner notified) |
| **UI/UX** | Dark / Light theme · EN / ES i18n · Gravatar avatar · Responsive layout |
| **Security** | Rate limiting on auth routes · CORS · RBAC middleware · Yup input validation |
| **API Docs** | Swagger UI at `/api-docs` (OpenAPI 3.0, v2.0.0) |

---

## Project Structure

```text
.
├── docker-compose.yml       # Orchestrates all 4 services
├── .env.example             # Environment variable template — copy to .env
├── backend/                 # Node.js REST API + async worker
│   ├── src/
│   │   ├── server.ts        # Express entry point
│   │   ├── worker.ts        # RabbitMQ consumer — processes email notifications
│   │   ├── config/swagger.ts
│   │   ├── controllers/     # HTTP layer (auth, tasks, projects, categories, tags, admin)
│   │   ├── services/        # Business logic + tests
│   │   ├── daos/            # Database access (Knex)
│   │   ├── middlewares/     # JWT guard, RBAC guard
│   │   ├── models/          # TypeScript interfaces
│   │   ├── routes/          # Express Router definitions
│   │   ├── schemas/         # Yup validation schemas
│   │   ├── db/
│   │   │   ├── migrations/  # Knex migration files (applied in order)
│   │   │   └── seeds/       # Default users + stress-test tasks
│   │   └── utils/           # Result<T> pattern
│   ├── Dockerfile
│   └── package.json
└── frontend/                # React SPA
    ├── src/
    │   ├── pages/           # Route-level components
    │   ├── components/      # Reusable UI (tasks, dashboard, admin, layout)
    │   ├── api/             # Axios instance + endpoint calls
    │   ├── contexts/        # Auth + Theme React contexts
    │   ├── hooks/           # Custom hooks (auth, projects, charts, i18n…)
    │   ├── styles/          # CSS Design Tokens + Blueprint overrides
    │   └── types/           # Shared TypeScript types
    ├── Dockerfile
    └── package.json
```

---

## Prerequisites

| Tool | Minimum version | Notes |
| --- | --- | --- |
| **Docker Desktop** | Any recent | [docker.com](https://www.docker.com/products/docker-desktop/) — required for both modes |
| **Node.js** | 18 LTS (v24 recommended) | Only needed for local dev mode |
| **npm** | 9+ | Bundled with Node |
| **Git** | Any | |

---

## Option A — Docker Compose (recommended)

The fastest way to run the full stack. API, frontend, database, and message broker all start together.

### 1. Clone and configure

```bash
git clone https://github.com/JCSC79/Proyecto-Final-Task-Manager.git
cd Proyecto-Final-Task-Manager
```

Copy the environment template and edit the values:

```bash
cp .env.example .env
```

Open `.env` and set **at minimum** a strong `JWT_SECRET`. For email notifications in development, leave the SMTP variables empty — the worker will use an auto-generated [Ethereal](https://ethereal.email) test account and print the preview URL to the logs.

```env
# .env — NEVER commit this file

JWT_SECRET=replace_with_a_strong_random_secret_32chars_minimum

# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me
POSTGRES_DB=tasks_db
DB_HOST=db                    # keep "db" inside Docker Compose
DB_USER=postgres
DB_PASSWORD=change_me
DB_NAME=tasks_db

# RabbitMQ
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=change_me
RABBITMQ_URL=amqp://admin:change_me@rabbitmq:5672

# Email / SMTP — leave empty to use Ethereal (dev preview only)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Task Manager <noreply@taskmanager.dev>"
```

> `DB_HOST=db` is the internal Docker Compose service name — keep it as `db` when using containers.

### 2. Start everything

```bash
docker-compose up -d
```

Docker builds the backend and frontend images on the first run (~1–2 min). After that, four containers start:

| Container | Description | Port |
| --- | --- | --- |
| `postgres_db` | PostgreSQL 15 | 5432 |
| `rabbitmq_broker` | RabbitMQ + management UI | 5672 / 15672 |
| `final_task_api` | Express REST API | 3000 |
| `final_task_frontend` | React SPA (Nginx) | 5173 |

### 3. Initialise the database (first time only)

```bash
docker exec final_task_api npm run db:migrate
docker exec final_task_api npm run db:seed
```

The seed creates **17 users** and **1 500 tasks** for testing:

| Email | Password | Role |
| --- | --- | --- |
| `admin@test.com` | `AdminPassword123!` | ADMIN |
| `user@test.com` | `123456J` | USER |
| `user1@test.com` … `user15@test.com` | `123456J` | USER |

The 1 500 tasks are distributed round-robin across all 17 users, split evenly across `PENDING` / `IN_PROGRESS` / `COMPLETED`.

> Running the seed again is safe — it truncates tasks and users first.  
> **Change these passwords before any public deployment.**

### 4. Open the app

| URL | Description |
| --- | --- |
| <http://localhost:5173> | Web application |
| <http://localhost:3000/api-docs> | Swagger / OpenAPI docs |
| <http://localhost:15672> | RabbitMQ management UI (`admin` / `change_me`) |

---

## Option B — Local Development Mode

Runs the API and frontend directly on your machine with hot-reload. Only PostgreSQL and RabbitMQ run via Docker.

### 1. Start the infrastructure

```bash
docker-compose up -d db rabbitmq
```

### 2. Configure the backend

```bash
cd backend
cp ../.env.example .env
```

Edit `backend/.env` — **important**: change `DB_HOST` to `127.0.0.1` and `RABBITMQ_URL` to use `localhost`:

```env
JWT_SECRET=replace_with_a_strong_random_secret_32chars_minimum
DB_HOST=127.0.0.1
DB_USER=postgres
DB_PASSWORD=change_me
DB_NAME=tasks_db
RABBITMQ_URL=amqp://admin:change_me@localhost:5672

# Email — leave empty to use Ethereal in dev
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Task Manager <noreply@taskmanager.dev>"
```

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev          # API on http://localhost:3000
```

In a **second terminal** (optional — processes email/notification events from RabbitMQ):

```bash
cd backend
npx tsx src/worker.ts
```

### 3. Start the frontend (new terminal)

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev          # App on http://localhost:5173
```

> `--legacy-peer-deps` is required because some BlueprintJS peer dependencies haven''t formally declared React 19 support yet.

---

## Running the Tests

**Backend** (Node.js built-in test runner — 13 tests):

```bash
cd backend
npm test
```

Tests run against `.env.test` — no real database or RabbitMQ connection is needed. All DAOs are mocked via dependency injection.

**Frontend** (Vitest — 27 tests):

```bash
cd frontend
npx vitest run
```

---

## Docker Management Cheat-Sheet

| Action | Command |
| --- | --- |
| Stop all (keep data) | `docker-compose stop` |
| Start again | `docker-compose start` |
| Full teardown (wipe volumes) | `docker-compose down -v` |
| View API logs live | `docker-compose logs -f api` |
| Rebuild API after code change | `docker-compose build api && docker-compose up -d api` |
| Rebuild frontend | `docker-compose build frontend && docker-compose up -d frontend` |
| Re-run migrations in container | `docker exec final_task_api npm run db:migrate` |
| Open psql inside container | `docker exec -it postgres_db psql -U postgres -d tasks_db` |

---

## Environment Variable Reference

All variables live in a single `.env` at the project root. Never commit it — it is in `.gitignore`. Only `.env.example` is tracked.

| Variable | Used by | Description |
| --- | --- | --- |
| `JWT_SECRET` | API | Signs JWT tokens. Minimum 32 characters. |
| `DB_HOST` | API | `db` in Docker Compose · `127.0.0.1` in local dev |
| `DB_USER` | API + Compose | PostgreSQL user |
| `DB_PASSWORD` | API + Compose | PostgreSQL password |
| `DB_NAME` | API + Compose | PostgreSQL database name |
| `POSTGRES_USER` | Compose | Same as `DB_USER` — initialises the DB container |
| `POSTGRES_PASSWORD` | Compose | Same as `DB_PASSWORD` |
| `POSTGRES_DB` | Compose | Same as `DB_NAME` |
| `RABBITMQ_DEFAULT_USER` | Compose | RabbitMQ admin username |
| `RABBITMQ_DEFAULT_PASS` | Compose | RabbitMQ admin password |
| `RABBITMQ_URL` | API / Worker | Full AMQP connection string |
| `SMTP_HOST` | Worker | SMTP server hostname. Leave empty to use Ethereal in dev. |
| `SMTP_PORT` | Worker | SMTP port (`587` for STARTTLS, `465` for SSL) |
| `SMTP_SECURE` | Worker | `true` for port 465, `false` for 587 |
| `SMTP_USER` | Worker | SMTP authentication username |
| `SMTP_PASS` | Worker | SMTP authentication password |
| `SMTP_FROM` | Worker | `From` address shown in sent emails |

See `.env.example` at the project root for a ready-to-copy template with inline comments.
