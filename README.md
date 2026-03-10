# Task Manager Backend - Phase 2

This project has evolved into a **Distributed Architecture**, focusing on **Separation of Concerns (SoC)**, **SOLID principles**, and **Asynchronous Messaging**. It is a REST API built with **Node.js (v24)**, **Express**, and **RabbitMQ**, using **TypeScript** in strict mode.

## Architecture Overview

The project follows a modular and decoupled structure:

- **Controller Layer (`src/controllers/`):** Handles HTTP requests and standardized API responses.
- **Service Layer (`src/services/`):** Orchestrates business logic and triggers asynchronous events.
- **Messaging Service (`src/services/messaging.service.ts`):** Encapsulates RabbitMQ producer logic using type-safe narrowing.
- **DAO Layer (`src/daos/`):** Encapsulates data persistence using Knex.js.
- **Worker (`src/worker.ts`):** An independent consumer process that processes task notifications from the message broker.

## API Capabilities (CRUD)

- **GET `/tasks`**: Retrieve all tasks.
- **GET `/tasks/:id`**: Retrieve a specific task by UUID.
- **POST `/tasks`**: Create a new task (auto-initialized as `PENDING`).
- **PATCH `/tasks/:id`**: Partially update a task (supports title, description, and status changes).
- **DELETE `/tasks/:id`**: Remove a task from the system.

## Tech Stack

- **Runtime:** Node.js v24.14.0+ (ESM Mode)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode - Zero any policy)
- **Framework:** [Express.js](https://expressjs.com/)
- **Messaging:** [RabbitMQ](https://www.rabbitmq.com/) (Message Broker)
- **Database:** PostgreSQL 15+ (Running on Docker)
- **Query Builder:** Knex.js (with Migration support)
- **Containerization:** Docker & Docker Compose

## Asynchronous Communication (RabbitMQ)

The system implements a **Producer-Consumer pattern**:

- When a task is created, the API (Producer) sends a persistent message to the `task_notifications` queue.
- An independent Worker (Consumer) listens to the queue and processes the data without blocking the main API flow.
- **Reliability:** Uses Manual Acknowledgments (ACK) and Durable Queues to ensure zero message loss.

## Persistence & Security (OWASP Focus)

The system is fully persistent, following **OWASP Defense Option 1**:

- **Parameterized Queries:** All database interactions use Knex's built-in methods to prevent SQL Injection.
- **Infrastructure as Code:** Database and Broker lifecycle are managed via Docker.

### Database Commands

- **Run Migrations:** `npx knex migrate:latest --knexfile knexfile.cjs`
- **Rollback:** `npx knex migrate:latest --knexfile knexfile.cjs`
- **Seed Data:** `npx knex seed:run --knexfile knexfile.cjs`

## Installation & Usage

1. **Spin up Infrastructure (Database & Broker):**
   ```docker compose up -d```
2. **Install dependencies:**
   ```npm install```
3. **Run migrations:**
   ```npx knex migrate:latest --knexfile knexfile.cjs```

## Running the Application

This project requires running two separate processes:

1. **Terminal 1 - API Server:**
   ```npm run dev```
2. **Terminal 2 - Background Worker:**
   ```npx tsx src/worker.ts```

## Quality Standards

- **Zero Any Policy:** 100% type coverage for robust development.
- **Narrowing Strategy:** Custom type-narrowing to handle complex library interfaces (amqplib) safely.
- **Decoupled Logic:** The business logic is isolated from the infrastructure.

## Key Technical Features

- Native TypeScript Support: Leveraging Node 24's latest capabilities for handling TypeScript modules.
- Zero Any Policy: Strictly typed interfaces and enums to prevent runtime errors.
- ESM Ready: Fully compatible with ECMAScript Modules ("type": "module").

## Project Structure

- `src/`: Main source code directory.
- `src/controllers/`: Request handling and HTTP response management (TaskController).
- `src/services/`: Core business logic and service orchestration (TaskService).
- `src/daos/`: Data Access Objects for persistence abstraction (TaskDAO).
- `src/models/`: Data contracts, interfaces, and enums (ITask, TaskStatus).
- `eslint.config.js`: Linter configuration for high code quality.
- `tsconfig.json`: TypeScript compiler and strict mode settings.
- `Dockerfile`: Containerization and deployment definition.

---
*Developed as part of the Backend Intensive Training - 2026.*
