# Task Manager — Frontend

React 19 SPA built with **Vite 7**, **TypeScript** (strict), **BlueprintJS v6**, and **TanStack Query v5**. Features JWT authentication via httpOnly cookie, dark/light theme, full i18n (EN/ES), a kanban task board, KPI analytics dashboard, and an admin panel.

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
│   ├── auth.api.ts         login / register / updateMe / logout calls
│   └── admin.api.ts        fetchAdminUsers / updateUserRole calls
├── contexts/
│   ├── AuthContext.tsx     Auth state shape (user, isAdmin, login, logout…)
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
│   ├── HomePage.tsx        Kanban task board
│   ├── DashboardPage.tsx   KPI analytics view
│   └── AdminPage.tsx       User management (ADMIN only)
├── components/
│   ├── layout/
│   │   ├── Header.tsx      Navbar — navigation, avatar, theme, language
│   │   └── Footer.tsx
│   ├── tasks/
│   │   ├── TaskBoard.tsx   Three-column paginated kanban board
│   │   ├── TaskForm.tsx    Create / edit task modal
│   │   ├── TaskFilters.tsx Search input + status filter buttons
│   │   └── TaskItem.tsx    Individual task card with inline actions
│   ├── dashboard/
│   │   └── DashboardView.tsx  KPI cards + Recharts (donut, bar, line)
│   └── admin/
│       └── AdminDashboard.tsx User stats table + charts + promote/demote
├── hooks/
│   ├── useAuth.ts          Consumes AuthContext
│   ├── useTheme.ts         Consumes ThemeContext
│   ├── useAdminDashboard.ts Admin data + search/pagination logic
│   ├── useChartColors.ts   Resolves CSS tokens to JS strings for Recharts
│   └── useLanguageToggle.ts EN ↔ ES switcher
├── styles/
│   ├── variables.css       All design tokens (colors, spacing, radii, shadows)
│   ├── globals.css         CSS reset + base styles + .sr-only utility class
│   ├── blueprint-overrides.css  Adapts Blueprint v6 classes to our tokens
│   └── index.css           Import order entry point
├── types/
│   ├── task.ts             Task, TaskStatus
│   ├── user.ts             IUser, UserRole, LoginResponse
│   └── admin.ts            IUserStats, IUserWithStats
└── utils/
    ├── toaster.ts          Singleton Blueprint toaster for app-wide notifications
    └── gravatar.ts         SHA-256 Gravatar URL generator (Web Crypto API)
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

Output goes to `dist/`. In Docker this is served by Nginx (see `frontend/Dockerfile` and `frontend/nginx.conf`).

---

## Running Tests

Uses Vitest with jsdom and Testing Library:

```bash
npx vitest run
```

Expected output: **27 tests, 0 failures** across 11 test files.

| Suite | File | What it tests |
| --- | --- | --- |
| Auth form | `AuthForm.test.tsx` | Login / register form rendering and submission |
| Header | `Header.test.tsx` | Navigation, avatar button, progress bar |
| TaskItem | `TaskItem.test.tsx` | Card rendering, dialogs, delete alert |
| DashboardView | `DashboardView.test.tsx` | KPI calculation, health score |
| HomePage | `HomePage.test.tsx` | Board renders after data load |
| LoginPage | `LoginPage.test.tsx` | Form fields present |
| RegisterPage | `RegisterPage.test.tsx` | Registration fields present |
| AdminPage | `AdminPage.test.tsx` | Admin layout renders |
| DashboardPage | `DashboardPage.test.tsx` | Dashboard layout renders |
| Gravatar | `gravatar.test.ts` | SHA-256 hashing + URL format |
| Toaster | `toaster.test.ts` | Singleton methods defined |

---

## Route Map

| Path | Access | Component |
| --- | --- | --- |
| `/login` | Public | `LoginPage` |
| `/register` | Public | `RegisterPage` |
| `/` | Protected (any role) | `HomePage` — kanban task board |
| `/dashboard` | Protected (any role) | `DashboardPage` — KPI analytics |
| `/admin` | Protected (ADMIN only) | `AdminPage` — user management |

---

## Authentication Flow

1. User submits login form → POST `/api/auth/login`
2. The API sets an **httpOnly cookie** (`auth_token`) and returns `{ token, user }` in the response body
3. `AuthProvider` stores the user object in `localStorage` (`auth_user`) for UI rendering (name, role, avatar)
4. Every Axios request uses `withCredentials: true`, so the browser sends the cookie automatically — no manual header management
5. A 401 response from the API clears `localStorage` and redirects to `/login`
6. `AuthProvider` reads `localStorage` on mount so the session survives a page refresh

---

## Theme System

- All colors, spacing, radii, and shadows are defined as **CSS Custom Properties** in `styles/variables.css` under `:root` (light theme) and `[data-theme="dark"]` (dark theme)
- Toggling dark mode sets `data-theme="dark"` on `<html>` **and** `bp6-dark` on `<body>` (both are required by BlueprintJS v6)
- `styles/blueprint-overrides.css` bridges Blueprint's own classes to our tokens using `bp6-` class selectors
- Every component uses **CSS Modules** — no inline styles, no hardcoded color values anywhere

---

## Internationalisation

All user-visible strings live in `src/i18n.ts` under `en.translation` and `es.translation`.

- The language switcher button (in the header) shows the **current** language's flag — click it to toggle
- The selected language is persisted via `i18next-browser-languagedetector`
- To add a new language: add a locale block in `i18n.ts` and update the toggle logic in `Header.tsx`

---

## Dashboard — Chart Click Navigation

Clicking a sector of the **donut chart** or a bar in the **workload bar chart** on the Dashboard navigates to the Home page and automatically filters the kanban board to show only the corresponding status column:

- Donut / bar → `navigate('/', { state: { statusFilter: 'PENDING' } })` (or `IN_PROGRESS` / `COMPLETED`)
- `HomePage` reads `location.state` on mount via a lazy `useState` initializer and applies the filter immediately, then clears the navigation state so a manual refresh resets the board to "All"

---

## Key Dependencies

| Package | Version | Purpose |
| --- | --- | --- |
| `react` | 19 | UI framework |
| `vite` | 7 | Build tool / dev server |
| `@blueprintjs/core` | 6 | UI component library |
| `@tanstack/react-query` | 5 | Server state, caching, refetch |
| `axios` | 1 | HTTP client |
| `react-router-dom` | 7 | Client-side routing |
| `react-i18next` | 16 | Internationalisation |
| `recharts` | 3 | Charts (dashboard + admin) |
| `flag-icons` | 7 | SVG country flag sprites |
| `vitest` | 4 | Unit test runner |
| `@testing-library/react` | 16 | Component test utilities |
