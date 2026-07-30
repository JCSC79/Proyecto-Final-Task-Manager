# Task Manager — Frontend

React 19 SPA built with **Vite 7**, **TypeScript** (strict), **BlueprintJS v6**, **TanStack Query v5**, **Socket.IO client**, and **dnd-kit**. Features JWT auth via httpOnly cookie, dark/light theme, EN/ES i18n, kanban drag-and-drop, real-time collaboration, per-task comments with Markdown, KPI analytics, and a full admin panel.

> This README covers the frontend in isolation. For the full project setup see the [root README](../README.md).

---

## Project Structure

```text
src/
├── main.tsx                App entry point
├── App.tsx                 Root component (providers)
├── i18n.ts                 react-i18next config + EN/ES strings
├── api/
│   ├── axiosInstance.ts    Axios (withCredentials, 401/403 interceptor)
│   ├── auth.api.ts         login / register / updateMe / logout
│   ├── project.api.ts      project CRUD + members + summary
│   ├── comment.api.ts      getComments / postComment
│   ├── category.api.ts     fetchCategories
│   ├── tag.api.ts          tag CRUD + assign/unassign
│   └── admin.api.ts        users / role / block / delete / analytics
├── contexts/
│   ├── AuthContext.tsx     Auth state shape
│   ├── AuthProvider.tsx    JWT cookie session + localStorage
│   ├── ThemeContext.tsx    Dark/Light theme state
│   └── ThemeProvider.tsx   Sets data-theme on <html>
├── router/
│   ├── AppRouter.tsx       Route definitions
│   ├── ProtectedRoute.tsx  Redirects to /login + mounts SocketProvider
│   └── AdminRoute.tsx      Redirects to / if not ADMIN
├── pages/
│   ├── LoginPage.tsx       Login + blocked account banner
│   ├── RegisterPage.tsx
│   ├── HomePage.tsx        Kanban + project selector + socket handlers
│   ├── DashboardPage.tsx   KPI analytics
│   └── AdminPage.tsx       Admin panel (ADMIN only)
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── tasks/
│   │   ├── ProjectSelector.tsx   Project bar (sort, create/rename/delete/join/leave)
│   │   ├── TaskBoard.tsx         DnD kanban (3 columns, pagination)
│   │   ├── TaskForm.tsx          Create task modal
│   │   ├── TaskFilters.tsx       Search + status + category + priority + "only my tasks"
│   │   ├── TaskItem.tsx          Task card with unread badge 💬 N
│   │   ├── TaskDetailsDialog.tsx Info / History / Comments tabs
│   │   ├── TaskEditDialog.tsx    Edit form
│   │   ├── CommentThread.tsx     Chat thread (Markdown, avatars, auto-scroll)
│   │   └── CommentThread.module.css
│   ├── dashboard/
│   │   └── DashboardView.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── UserManagementTable.tsx
│       ├── DeleteUserDialog.tsx
│       ├── ResourceManagement.tsx  Workload bars per user (real-time)
│       ├── LeadTimeChart.tsx        Avg resolution time by category
│       └── charts/
├── hooks/
│   ├── useSocket.ts            SocketProvider + useSocket (shared connection)
│   ├── useUnreadComments.ts    Map<taskId, count> for unread badges
│   ├── useAuth.ts
│   ├── useTheme.ts
│   ├── useProjectActions.ts
│   ├── useAdminDashboard.ts    Admin data + real-time invalidation
│   ├── useChartColors.ts
│   └── useLanguageToggle.ts
├── styles/
│   ├── variables.css           Design tokens (colors, spacing, radii, shadows)
│   ├── globals.css
│   ├── blueprint-overrides.css
│   └── index.css
├── types/
│   ├── task.ts
│   ├── user.ts                 includes is_blocked
│   ├── project.ts
│   └── admin.ts
└── utils/
    ├── toaster.ts
    └── gravatar.ts
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

Expected output: **102 tests, 0 failures**. Tests are co-located next to the component they cover (e.g. `LoginPage.test.tsx`, `AuthForm.test.tsx`).

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

### Real-time collaboration (Socket.IO)

`SocketProvider` (mounted in `ProtectedRoute`) creates **one** persistent WebSocket connection per authenticated session, shared across all pages via React Context. Components call `useSocket({ onTaskUpdated, onNewComment, … })` to register event handlers without creating additional connections.

Events handled on the frontend:

| Event | Effect |
| --- | --- |
| `task-updated` | Updates task in TanStack Query cache (create or update) |
| `task-deleted` | Removes task from cache |
| `new-comment` | Appends to comment list if dialog open; increments badge if closed |
| `project-created/deleted` | Invalidates `['projects']` query |
| `project-members-changed` | Invalidates `['projects']` query |
| `user-registered` | Invalidates `['admin-users']` and `['admin-analytics']` queries |

### Comments with Markdown

Each task has a **Comments** tab powered by `CommentThread`. Messages support CommonMark Markdown (`**bold**`, `_italic_`, `` `code` ``, lists). Avatars show the user's Gravatar if set, or deterministic colour-coded initials otherwise.

---

## License

[MIT](../LICENSE) © 2026
