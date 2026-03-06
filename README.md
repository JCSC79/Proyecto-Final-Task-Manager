# Task Manager Backend - Phase 1

This project has evolved from a basic setup to a **Multi-layered Architecture**, focusing on the **Separation of Concerns (SoC)** and **SOLID principles**. It is a REST API built with **Node.js (v24)** and **Express**, using **TypeScript** in strict mode.

## Architecture Overview

The project follows a modular structure to ensure scalability and maintainability:

- **Controller Layer (`src/controllers/`):** Handles HTTP requests, input validation, and sends standardized API responses (201, 204, 404).
- **Service Layer (`src/services/`):** Orchestrates business logic (ID generation, timestamps, and status rules). It is agnostic to the transport layer (Express).
- **DAO Layer (`src/daos/`):** (Data Access Object) Encapsulates data persistence. Currently manages an in-memory array but is designed for easy migration to a Database (MongoDB/PostgreSQL).
- **Model Layer (`src/models/`):** Defines strict contracts using TypeScript Interfaces and Enums.

## API Capabilities (CRUD)

- **GET `/tasks`**: Retrieve all tasks.
- **GET `/tasks/:id`**: Retrieve a specific task by UUID.
- **POST `/tasks`**: Create a new task (auto-initialized as `PENDING`).
- **PATCH `/tasks/:id`**: Partially update a task (supports title, description, and status changes).
- **DELETE `/tasks/:id`**: Remove a task from the system.

## Tech Stack

- **Runtime:** Node.js v24.14.0+ (ESM Mode)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Framework:** [Express.js](https://expressjs.com/)
- **Linter:** [ESLint v10](https://eslint.org/) (Flat Config)
- **Development Engine:** [tsx](https://tsx.is/) (TypeScript Execute with native Node 24 support)
- **Containerization:** Docker

## Installation & Usage

1. **Install dependencies:**
   ```npm install```
2. **Run in development mode (Hot Reload):**
   ```npm run dev```
3. **Build to JavaScript:**
   ```npm run build```

## Quality Standards

- **Zero Any Policy:** 100% type coverage for robust development.
- **RESTful Best Practices:** Proper use of HTTP verbs and status codes.
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
