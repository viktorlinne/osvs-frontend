# Frontend Architecture (osvs-frontend)

## Overview

This is a React + TypeScript Single Page Application built with Vite.

Key characteristics:

- SPA routing via React Router (data router / `createBrowserRouter`)
- Auth handled via `AuthProvider` context and route guarding
- Global error banner handled via `ErrorProvider` context
- No Redux/Zustand/React Query; state is primarily local with hooks
- Forms use `react-hook-form`
- API layer uses a shared Axios instance with cookie-based auth and refresh handling

---

## Bootstrapping

### `src/main.tsx`

- Creates the root React tree
- Wraps the router with:
  - `ErrorProvider` (global error banner + reporting)
  - `AuthProvider` (auth state + session bootstrap)

---

## Layout & Navigation

### `src/components/layout/AppLayout.tsx`

- App shell:
  - Navbar
  - Outlet (route content)
  - Footer
- Also participates in global unauthorized handling registration (via auth/api integration)

---

## Routing

### `src/Router.tsx`

- Routing is defined using `createBrowserRouter`
- Public routes include:
  - `/`, `/about`, `/gdpr`, `/contact`, `/login`, `/lodges`, `/lodges/:id`
- Most routes are protected via `AuthGuard`
- Certain create/edit flows are role-gated (Admin/Editor)
- Wildcard route uses `NotFound`

### Auth Guard

`src/components/auth/AuthGuard.tsx`

- Ensures user session is resolved before showing protected content
- Redirects unauthenticated users to `/login`
- Known UX risk: potential “blank” while auth is resolving

---

## State Management

- Local state uses `useState`, `useEffect`
- Forms use `react-hook-form`
- Global state:
  - `AuthProvider` (`src/providers/AuthProvider.tsx`)
  - `ErrorProvider` (`src/providers/ErrorProvider.tsx`)
- Fetch lifecycle is standardized via `useFetch` (`src/hooks/useFetch.ts`)

---

## API Layer

### `src/api/api.ts`

- Shared Axios instance with:
  - baseURL
  - `withCredentials`
  - timeout
  - 401 refresh-and-retry interceptor
- `fetchData` centralizes:
  - response unwrapping
  - error normalization
  - reporting to `ErrorProvider` for global banner

### `src/services/*`

- Services represent a transport boundary:
  - endpoints, DTO parsing, normalization
- Pages should call services, not axios directly

---

## UI Structure

- Pages: `src/pages/*`
- Components grouped by feature area: `src/components/*` (events/profile/map/ui/etc.)
- UI primitives: `src/components/ui/*`
- Global styles: `index.css`

---

## Build & Tooling

Scripts in `package.json`:

- `dev`
- `build` (`tsc -b && vite build`)
- `lint`
- `preview`

TypeScript:

- strict mode enabled (see `tsconfig.app.json`)

Vite:

- dev proxy configured in `vite.config.ts`

---

## Known Risks / Improvement Areas

- Type-safety erosion in API usage (casting / unknown unions can hide contract drift)
- Some direct axios usage bypasses services (should be refactored into services)
- Large initial bundle; no route-level code splitting
- UI text encoding artifacts (“â€¦” etc.) exist in some pages
- No automated test suite; regressions rely on lint + build + manual checks
- Time/date logic is complex and may have DST edge risks (`dateUtils.ts`)
