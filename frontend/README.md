# Task Manager — Frontend

React 19 SPA built with **Vite 7**, **TypeScript** (strict), **BlueprintJS v6**, and **TanStack Query v5**. Features JWT authentication, theme switching, full i18n (EN/ES), and an admin panel with charts.

---

## Project Structure

```src/
├── main.tsx              App entry point, providers, global CSS imports
├── App.tsx               Root component (wraps providers)
├── i18n.ts               react-i18next config + EN/ES translation strings
├── index.css
├── api/
│   ├── axiosInstance.ts  Axios instance with JWT interceptors
│   ├── auth.api.ts       login / register / updateMe requests
│   └── admin.api.ts      fetchAdminUsers / updateUserRole requests
├── contexts/
│   ├── AuthContext.tsx   JWT state, login / register / updateName / logout
│   └── ThemeContext.tsx  Dark/Light toggle, bp6-dark on <body>
├── router/
│   ├── AppRouter.tsx     All routes (public / protected / admin-only)
│   ├── ProtectedRoute.tsx
│   └── AdminRoute.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── HomePage.tsx      Task board view
│   ├── DashboardPage.tsx KPI analytics view
│   └── AdminPage.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx    Navbar with Gravatar, edit-name dialog, theme/lang toggles
│   │   └── Footer.tsx
│   ├── tasks/
│   │   ├── TaskBoard.tsx Paginated kanban columns
│   │   ├── TaskForm.tsx  Create task form
│   │   ├── TaskFilters.tsx
│   │   └── TaskItem.tsx
│   ├── dashboard/
│   │   └── DashboardView.tsx  Recharts KPI dashboard
│   └── admin/
│       └── AdminDashboard.tsx User stats, charts, promote/demote
├── styles/               CSS Design Token architecture
│   ├── variables.css     All tokens (colors, spacing, radii, shadows)
│   ├── globals.css       Reset + base styles
│   ├── blueprint-overrides.css  Adapts Blueprint v6 classes to our tokens
│   └── index.css         Import order entry point
├── types/
│   ├── task.ts
│   ├── user.ts
│   └── admin.ts
└── utils/
    ├── toaster.ts        Singleton Blueprint toaster
    └── gravatar.ts       SHA-256 Gravatar URL generator (Web Crypto API)
```

---

## Setup

### Prerequisites

- Node.js ≥ 18 (v24 recommended)
- The backend API must be running at `http://localhost:3000` (see root README)

### 1. Install dependencies

```npm install --legacy-peer-deps```

> `--legacy-peer-deps` is required because some BlueprintJS peer deps have not yet declared support for React 19.

### 2. Start the dev server

```npm run dev```

Open **<http://localhost:5173>**

### 3. Build for production

```npm run build```

Output goes to `dist/`. Serve with any static host or `npx serve dist`.

---

## Authentication Flow

1. User visits `/login` or `/register`
2. On success the API returns `{ token, user }` — both are stored in `localStorage` (`auth_token`, `auth_user`)
3. Every Axios request automatically attaches `Authorization: Bearer <token>` via the request interceptor
4. A 401 response clears localStorage and redirects to `/login`
5. `AuthContext` reads from `localStorage` on page load so the session survives refresh

---

## Route Map

| Path | Access | Component |
| --- | --- | --- |
| `/login` | Public | LoginPage |
| `/register` | Public | RegisterPage |
| `/` | Protected (any role) | HomePage (task board) |
| `/dashboard` | Protected (any role) | DashboardPage (KPIs) |
| `/admin` | Protected (ADMIN only) | AdminPage |

---

## Theme System

- **Tokens** are defined as CSS Custom Properties in `styles/variables.css` under `:root` (light) and `[data-theme="dark"]`
- Toggling dark mode sets `data-theme="dark"` on `<html>` **and** `bp6-dark` on `<body>` (required by BlueprintJS v6)
- `styles/blueprint-overrides.css` bridges Blueprint's own classes to our token variables using `bp6-` prefix (Blueprint v6)
- Every component uses **CSS Modules** — zero inline styles, zero hardcoded colors

---

## Internationalisation

All user-visible strings live in `src/i18n.ts` under `en.translation` and `es.translation`. To add a new language:

1. Add a new locale block in `i18n.ts`
2. Add the language button logic in `Header.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`

The language switcher button shows the **current** language's flag (click to switch).

---

## Key Dependencies

| Package | Purpose |
| --- | --- |
| `react` 19 | UI framework |
| `vite` 7 | Build tool / dev server |
| `@blueprintjs/core` 6 | UI component library |
| `@tanstack/react-query` 5 | Server state management |
| `axios` | HTTP client |
| `react-router-dom` 7 | Client-side routing |
| `react-i18next` | Internationalisation |
| `recharts` | Charts (dashboard + admin) |
| `flag-icons` | SVG country flag sprites |
