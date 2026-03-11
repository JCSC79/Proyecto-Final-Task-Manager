# Task Manager Backend - Phase 2

This project has evolved into a **Distributed Architecture**, focusing on **Separation of Concerns (SoC)**, **SOLID principles**, and **Asynchronous Messaging**. It is a REST API built with **Node.js (v24)**, **Express**, and **RabbitMQ**, using **TypeScript** in strict mode.

## Architecture Overview

The project follows a modular and decoupled structure:

- **Controller Layer (`src/controllers/`):** Handles HTTP requests and standardized API responses.
- **Service Layer (`src/services/`):** Orchestrates business logic and triggers asynchronous events.
- **Messaging Service (`src/services/messaging.service.ts`):** Encapsulates RabbitMQ producer logic using type-safe narrowing.
- **DAO Layer (`src/daos/`):** Encapsulates data persistence using Knex.js.
- **Worker (`src/worker.ts`):** An independent consumer process that processes task notifications from the message broker.
- **Functional Error Handling (`src/utils/result.ts`):** Implements the Result Pattern to encapsulate operation outcomes, ensuring predictable and type-safe error management across the Service and Controller layers.

## Design Patterns

- **Result Pattern:** Used to replace traditional exception-based error handling. It forces the developer to check for success/failure explicitly, leading to more robust code.
- **Singleton:** Services and DAOs are exported as singletons to maintain a single point of truth and efficient resource usage.

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
- **Documentation:** [Swagger UI](https://swagger.io/tools/swagger-ui/) & [OpenAPI 3.0](https://www.openapis.org/)

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
- **Rollback:** `npx knex migrate:rollback --knexfile knexfile.cjs`
- **Seed Data:** `npx knex seed:run --knexfile knexfile.cjs`

## Installation & Usage

1. **Spin up Infrastructure (Database & Broker):**
   ```docker compose up -d```
2. **Install dependencies:**
   ```npm install```
3. **Run migrations:**
   ```npx knex migrate:latest --knexfile knexfile.cjs```

## Interactive API Documentation (Swagger)

The project includes a fully interactive documentation interface built with **Swagger UI** and **OpenAPI 3.0**. This allows for real-time testing of all endpoints without external tools like Postman.

- **Access URL:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Features:**
  - Visual CRUD explorer.
  - Standardized Request/Response schemas (`Task`, `ErrorResponse`).
  - Integrated testing client ("Try it out" feature).
  - Detailed error state modeling based on the **Result Pattern**.

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
- **Consistent Error Modeling:** All API responses follow a standardized JSON structure derived from the Result object, providing clear feedback for both success and failure states.
- **Contract-First Documentation:** Standardized API contracts using OpenAPI 3.0 to ensure consistency between Backend and potential Frontend consumers.

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
- `src/config/`: Configuration files for external libraries (Swagger, etc.).
- `eslint.config.js`: Linter configuration for high code quality.
- `tsconfig.json`: TypeScript compiler and strict mode settings.
- `Dockerfile`: Containerization and deployment definition.

---
*Developed as part of the Backend Intensive Training - 2026.*
