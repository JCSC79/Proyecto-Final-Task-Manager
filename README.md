# Full-Stack Task Manager - Distributed Architecture

This repository contains a complete Task Management system with a **Node.js/Express Backend** and a **React Frontend**. Optimized for handling 500+ tasks with distributed architecture and real-time metrics.

## Project Structure

- **`/backend`**: Node.js v24 API. Uses PostgreSQL, RabbitMQ, and the Result Pattern.
- **`/frontend`**: React 19 application using Vite, BlueprintJS, and TanStack Query.
- **`docker-compose.yml`**: Infrastructure (PostgreSQL 15 & RabbitMQ) shared by the entire project.

---

## Quick Start (How to run)

### 1. Infrastructure (Docker)

From the **root** folder, spin up the database and the message broker:
```bash
docker compose up -d
```

### 2. Backend Setup

```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Setup database and create default users
npm run db:setup    # Runs migrations + seeds (creates admin@test.com & user@test.com)

# Start the API
npm run dev         # Server runs at http://localhost:3000
```

**Default Test Users:**
- **Admin:** `admin@test.com` / `AdminPassword123!`
- **User:** `user@test.com` / `UserPassword123!`

### 3. Frontend Setup

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev         # UI runs at http://localhost:5173
```

### 4. Optional: Background Worker

To process background notifications, run the worker in a separate terminal:
```bash
cd backend
npx tsx src/worker.ts
```

## API Documentation

Interactive Swagger UI explorer available at: <http://localhost:3000/api-docs>

## Security Features

- **JWT Authentication** with configurable secrets
- **Role-Based Access Control (RBAC)** - Admin/User roles
- **Privilege Escalation Protection** - Server-side role validation
- **XSS Mitigation** - JWT stored in sessionStorage
- **Environment Configuration** - Sensitive data in .env files

## Tech Stack Summary

- **Backend:** Node.js (v24), Express, TypeScript, Knex.js, RabbitMQ, JWT
- **Frontend:** React 19, Vite, BlueprintJS, Axios, TanStack Query, i18next
- **Database:** PostgreSQL with automated migrations & seeds
- **DevOps:** Docker & Docker Compose, Environment configuration

---
*Developed as part of the Backend Intensive Training - 2026.*
