# Task Manager — Frontend

React 19 SPA built with **Vite 7**, **TypeScript** (strict), **BlueprintJS v6**, and **TanStack Query v5**. Features JWT authentication via httpOnly cookie, dark/light theme, full i18n (EN/ES), a kanban task board with drag-and-drop, project workspaces, KPI analytics dashboard, and an admin panel.

> This README covers the frontend in isolation. For the full project setup (Docker Compose, environment variables, backend) see the [root README](../README.md).

---

## Project Structure

```text
src/
├── main.tsx                App entry point — mounts providers and global CSS
├── App.tsx                 Root component (wraps all context providers)
├── i18n.ts                 react-i18next config + EN/ES translation strings
├── api/
│   ├── axiosInstance.ts    Axios instance (withCredentials: true for cookies)
│   ├── auth.api.ts         login / register / updateMe / logout
│   ├── project.api.ts      project CRUD + join/leave/member management
│   ├── category.api.ts     fetchCategories
│   ├── tag.api.ts          tag CRUD + assign/unassign to tasks
│   └── admin.api.ts        fetchAdminUsers / updateUserRole
├── contexts/
│   ├── AuthContext.tsx     Auth state shape
│   ├── AuthProvider.tsx    JWT cookie session management
│   ├── ThemeContext.tsx    Dark/Light theme state
│   └── ThemeProvider.tsx   Sets data-theme on <html> + bp6-dark on <body>
├── router/
│   ├── AppRouter.tsx       Route definitions
│   ├── ProtectedRoute.tsx  Redirects to /login if not authenticated
│   └── AdminRoute.tsx      Redirects to / if not ADMIN role
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── HomePage.tsx        Kanban board + project selector
│   ├── DashboardPage.tsx   KPI analytics view
│   └── AdminPage.tsx       User management (ADMIN only)
├── components/
│   ├── layout/
│   │   ├── Header.tsx      Navbar — navigation, avatar, theme, language toggle
│   │   └── Footer.tsx
│   ├── tasks/
│   │   ├── ProjectSelector.tsx   Project chip bar — create/rename/delete/join/leave
│   │   ├── TaskBoard.tsx         Three-column DnD kanban board
│   │   ├── TaskForm.tsx          Create task modal (project, category, priority, tags)
│   │   ├── TaskFilters.tsx       Search + status filter + category filter
│   │   ├── TaskItem.tsx          Task card with move arrows, delete, DnD handle
│   │   ├── TaskDetailsDialog.tsx Task detail view with info tab + history tab
│   │   ├── TaskEditDialog.tsx    Edit form dialog (title, description, priority, tags)
│   │   └── taskUtils.ts          Shared helpers (getTranslatedStatus)
│   ├── dashboard/
│   │   └── DashboardView.tsx     KPI cards + Recharts (donut, bar, line) + PDF button
│   └── admin/
│       └── AdminDashboard.tsx    User stats table + charts + promote/demote + PDF button
├── hooks/
│   ├── useAuth.ts              Consumes AuthContext
│   ├── useTheme.ts             Consumes ThemeContext
│   ├── useProjectActions.ts    Project mutation bundle (create/delete/join/leave/rename)
│   ├── useAdminDashboard.ts    Admin data + search/pagination logic
│   ├── useChartColors.ts       Resolves CSS tokens to JS strings for Recharts
│   └── useLanguageToggle.ts    EN ↔ ES switcher
├── styles/
│   ├── variables.css           All design tokens (colors, spacing, radii, shadows)
│   ├── globals.css             CSS reset + base styles + .sr-only utility
│   ├── blueprint-overrides.css Adapts Blueprint v6 to our design tokens
│   └── index.css               Import order entry point
├── types/
│   ├── task.ts                 Task, TaskStatus, TaskPriority, ITag, ICategory
│   ├── user.ts                 IUser, UserRole, LoginResponse
│   ├── project.ts              IProject, ProjectMember, MemberRole
│   └── admin.ts                IUserStats, IUserWithStats
└── utils/
    ├── toaster.ts              Singleton Blueprint toaster for app-wide notifications
    └── gravatar.ts             SHA-256 Gravatar URL generator (Web Crypto API)
```

---

## Local Development Setup

### Prerequisites

- Node.js ≥ 18 (v24 recommended)
- The backend API must be running at `http://localhost:3000` (see [root README](../README.md))

### 1. Install dependencies

```bash
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is required because some BlueprintJS peer dependencies have not yet declared support for React 19.

### 2. Start the dev server

```bash
npm run dev
```

Open **<http://localhost:5173>**

### 3. Build for production

```bash
npm run build
```

Output goes to `dist/`. In Docker this folder is served by Nginx (see `frontend/Dockerfile` and `frontend/nginx.conf`).

---

## Running Tests

```bash
npx vitest run
```

Expected output: **27 tests, 0 failures**. Tests are co-located next to the component they cover (e.g. `LoginPage.test.tsx`, `AuthForm.test.tsx`).

---

## Key UI Features

### Kanban board with drag-and-drop

Tasks are organised in three columns (Pending / In Progress / Completed). Cards can be dragged between columns using **dnd-kit**; the status is updated immediately on drop with an optimistic mutation.

### Project workspaces

The chip bar at the top of the board lets you switch between projects. Each project has its own tasks, tags, and member list. The active project ID is persisted in `localStorage` across sessions.

### Task detail & history

Clicking a task card opens a detail dialog with two tabs:

- **Info** — title, description, priority, category, tags, creator, project.
- **History** — chronological audit log fetched from `GET /api/tasks/:id/history`.

### PDF export

The dashboard and admin panel each have a "Download PDF" button that calls the corresponding export endpoint and triggers a browser file download.

### Theming & i18n

Theme (dark/light) and language (EN/ES) toggles are in the header. Preferences are stored in `localStorage`. All user-facing strings run through `react-i18next`.
