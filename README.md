# Full-Stack Task Manager

A complete full-stack Task Management system with JWT authentication, role-based access control, an admin panel, and real-time metrics. Built with Node.js/Express (backend) and React/Vite (frontend), containerised with Docker.

---

## Project Structure

```/
├── backend/          Node.js 24 REST API (Express, PostgreSQL, RabbitMQ)
├── frontend/         React 19 SPA (Vite, BlueprintJS v6, TanStack Query)
└── docker-compose.yml  Infrastructure (PostgreSQL 15 + RabbitMQ 3)
```

---

## Feature Overview

| Area | What's included |
| --- | --- |
| **Auth** | JWT login · self-registration · PATCH /api/auth/me (update display name) |
| **Tasks** | Full CRUD · status workflow (Pending → In Progress → Completed) · bulk delete |
| **Dashboard** | KPI cards · status donut chart · avg. completion time · board health score |
| **Admin panel** | User list · per-user task stats · promote/demote roles · stacked bar chart |
| **UI** | Dark / Light theme · EN / ES i18n · Gravatar avatar · CSS Design Tokens |
| **Infra** | Rate limiting · dotenv · RabbitMQ async notifications · Swagger docs |

---

## Prerequisites

| Tool | Minimum version | Notes |
| --- | --- | --- |
| Node.js | 18 LTS (v24 recommended) | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Bundled with Node |
| Docker Desktop | Any recent | [docker.com](https://www.docker.com/products/docker-desktop/) |
| Git | Any | |

Make sure **Docker Desktop is running** before the steps below.

---

## Quick Start — Option A: Full Docker (recommended)

Everything — API, database, message broker — runs in containers. No local Node required for the backend.

### 1. Clone the repo

```git clone https://github.com/JCSC79/proyecto-backend-fase1.git```
```cd <repo-folder>```

### 2. Configure backend environment

```cp backend/.env.example backend/.env```

Open `backend/.env` and set a strong `JWT_SECRET` (any random string ≥ 32 chars). The DB and RabbitMQ values are pre-filled to match `docker-compose.yml`.

### 3. Start infrastructure + API

```docker-compose up -d```

This starts three containers:

- `postgres_db` — PostgreSQL 15 on port **5432**
- `rabbitmq_broker` — RabbitMQ on ports **5672** (AMQP) / **15672** (management UI)
- `task_api` — The Express API on port **3000** (built from `backend/Dockerfile`)

### 4. Run database migrations & seed data

The API container has `knex` available. Run migrations then seed the two default users:

```docker exec task_api npm run db:migrate```

```docker exec task_api npm run db:seed```

> **Default credentials after seeding:**
>
> | Email | Password | Role |
> | --- | --- | --- |
> | <admin@test.com> | AdminPassword123! | ADMIN |
> | <user@test.com> | UserPassword123! | USER |

### 5. Start the frontend

```cd frontend```
```npm install --legacy-peer-deps```
```npm run dev```

Open **<http://localhost:5173>** in your browser.

---

## Quick Start — Option B: Local backend (no Docker for the API)

Use this if you want hot-reload TypeScript in the backend without rebuilding the image on every change.

### 1–2. Same as Option A (clone + copy .env)

### 3. Start only infrastructure

```docker-compose up -d db rabbitmq```

### 4. Install and run the backend locally

```cd backend```
```npm install```
```npm run db:migrate```
```npm run db:seed```
```npm run dev```          # API at <http://localhost:3000>

Optional — run the RabbitMQ worker in a second terminal:

```cd backend```
```npx tsx src/worker.ts```

### 5. Frontend — same as Option A step 5

---

## Useful URLs

| Service | URL |
| --- | --- |
| Frontend | <http://localhost:5173> |
| Backend API | <http://localhost:3000> |
| Swagger UI | <http://localhost:3000/api-docs> |
| RabbitMQ Management | <http://localhost:15672> (user: `JC` / pass: `abc123..`) |

---

## Pushing to your repo (current branch)

```# From the project root
git add .
git commit -m "feat: auth, admin panel, CSS architecture, gravatar, i18n updates"
git push origin feature/auth-rebuild
```

If you want to merge into main afterwards:

```git checkout main```
```git merge feature/auth-rebuild```
```git push origin main```

---

## Re-deploying after backend code changes

Because the API runs inside Docker, source file changes require a rebuild:

```docker-compose build api```
```docker-compose up -d api```

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 24, TypeScript (strict) |
| Framework | Express 5 |
| ORM / Query | Knex.js 3 + PostgreSQL 15 |
| Messaging | RabbitMQ 3 (amqplib) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Frontend | React 19, Vite 7, TypeScript |
| UI Kit | BlueprintJS v6 |
| State / Cache | TanStack Query v5 |
| Charts | Recharts |
| i18n | react-i18next |
| HTTP client | Axios |
| Containers | Docker + Docker Compose |
