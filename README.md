# Full-Stack Task Manager

A full-stack Task Management system containerized with Docker. Features JWT authentication, RBAC, real-time metrics, and an Nginx-backed frontend.

---

## Project Structure

```/
├── backend/          Node.js 24 REST API (Express, PostgreSQL, RabbitMQ)
├── frontend/         React 19 SPA (Vite, BlueprintJS v6, TanStack Query) + Nginx
└── docker-compose.yml  Orchestration for all services
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

## Quick Start (Dockerized)

Ensure Docker Desktop is running.

### 1. Environment Setup

```git clone https://github.com/JCSC79/proyecto-backend-fase1.git```

```cd <repo-folder>```

```cp backend/.env.example backend/.env```

Edit `backend/.env` and set a strong `JWT_SECRET` (any random string ≥ 32 chars). The DB and RabbitMQ values are pre-filled to match `docker-compose.yml`.

### 2. Launch Ecosystem

```docker-compose up -d```

This builds and starts:

- `postgres_db` — PostgreSQL 15 on port **5432**
- `rabbitmq_broker` — RabbitMQ on ports **5672** (AMQP) / **15672** (management UI)
- `task_api` — The Express API on port **3000** (built from `backend/Dockerfile`)
- `task_frontend` — The frontend on port **5173** (built from `frontend/Dockerfile`)

### 3. Initialize Database

- `docker exec task_api npm run db:migrate`
- `docker exec task_api npm run db:seed`

### 4. Access

- Web App: <http://localhost:5173>

- API Docs: <http://localhost:3000/api-docs>

- RabbitMQ Management: <http://localhost:15672> (user: `JC` / pass: `abc123..`)

> **Default credentials after seeding:**
>
> | Email | Password | Role |
> | --- | --- | --- |
> | <admin@test.com> | AdminPassword123! | ADMIN |
> | <user@test.com> | 123456J | USER |

## Useful Management Commands

| Action | Command |
| --- | --- |
| Stop (Pause) | `docker-compose stop` |
| Start (Resume) | `docker-compose start` |
| Full Wipe | `docker-compose down` |
| Rebuild Front | `docker-compose up -d --build frontend` |
| Restart API | `docker-compose restart api` |
| View API Logs | `docker-compose logs -f api` |

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
