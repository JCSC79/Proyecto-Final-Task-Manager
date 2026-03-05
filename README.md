# Task Manager Backend - Phase 1

This project is part of **Phase 1** of the Backend Learning Path. It is a REST API built with **Node.js (v24)** and **Express**, using **TypeScript** in strict mode to ensure robust and professional development.

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

This project strictly follows a "Zero Any" policy, ensuring all code is properly typed. The linter enforces these rules to maintain high code quality standards.

## Key Technical Features

- Native TypeScript Support: Leveraging Node 24's latest capabilities for handling TypeScript modules.
- Zero Any Policy: Strictly typed interfaces and enums to prevent runtime errors.
- ESM Ready: Fully compatible with ECMAScript Modules ("type": "module").

## Project Structure

- `src/`: Source code.
- `src/models/`: Data interfaces and enums (ITask, TaskStatus).
- `dist/`: Compiled JavaScript files.
- `eslint.config.js/`: Linter configuration for code quality.
- `tsconfig.json`: TypeScript compiler settings.
- `Dockerfile`: Container image definition.

---
*Developed as part of the Backend Intensive Training - 2026.*
