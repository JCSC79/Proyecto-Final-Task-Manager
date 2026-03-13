# Full-Stack Task Manager - Distributed Architecture

This repository contains a complete Task Management system with a **Node.js/Express Backend** and a **React Frontend**. The project follows a monorepo structure and uses Docker for infrastructure.

## Project Structure

- **`/backend`**: The core API. Distributed architecture, RabbitMQ messaging, and PostgreSQL.
- **`/frontend`**: React application using Vite, BlueprintJS, and TanStack Query.
- **`docker-compose.yml`**: Infrastructure (PostgreSQL 15 & RabbitMQ) shared by the entire project.

---

## Quick Start (How to run)

### 1. Infrastructure (Docker)

From the **root** folder, spin up the database and the message broker:
```docker compose up -d```

### 2. Backend Setup

```cd backend```
```npm install```

#### Run migrations to setup the DB

```npx knex migrate:latest --knexfile knexfile.cjs```

#### Start the API

```npm run dev```

#### Start the Background Worker (in a separate terminal)

```npx tsx src/worker.ts```

API Documentation available at: <http://localhost:3000/api-docs>

### 3. Frontend Setup

```cd frontend```

## Note: uses --legacy-peer-deps for React 19 compatibility

```npm install --legacy-peer-deps```
```npm run dev```
Frontend running at: <http://localhost:5173>

## Tech Stack Summary

- **Backend:** Node.js (v24), Express, TypeScript, Knex.js, RabbitMQ.
- **Frontend:** React 19, Vite, BlueprintJS, Axios, TanStack Query.
- **Database:** PostgreSQL.
- **DevOps:** Docker & Docker Compose.

---
Developed as part of the Backend Intensive Training - 2026.
