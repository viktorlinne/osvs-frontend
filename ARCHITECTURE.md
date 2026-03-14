# Frontend Architecture (osvs-frontend)

## Overview

This frontend is a React + TypeScript Single Page Application built with Vite.

Key characteristics:

- SPA routing via React Router (`createBrowserRouter`)
- Auth handled through context providers and route guards
- Global non-field errors handled through `ErrorProvider`
- Forms use `react-hook-form`
- API requests go through shared Axios helpers in `src/services/api.ts`
- Backend validation errors are rendered inline from `details.fields`

---

## Bootstrapping

### `src/main.tsx`

- Creates the root React tree
- Wraps the router with:
  - `ErrorProvider` from `src/context/ErrorProvider.tsx`
  - `AuthProvider` from `src/context/AuthProvider.tsx`

---

## Layout and Navigation

### `src/components/layout/AppLayout.tsx`

- Provides the app shell:
  - Navbar
  - Outlet
  - Footer
- Participates in global auth / unauthorized handling registration

---

## Routing

### `src/Router.tsx`

- Defines routes with `createBrowserRouter`
- Public routes include `/`, `/about`, `/gdpr`, `/contact`, `/login`, `/lodges`, `/lodges/:id`
- Most application routes are protected with `AuthGuard`
- Create/edit flows use existing role-gating patterns for Admin / Editor access

### `src/components/auth/AuthGuard.tsx`

- Waits for auth state to resolve before rendering protected routes
- Redirects unauthenticated users to `/login`

---

## State Management

- Local state: `useState`, `useEffect`, component state
- Form state: `react-hook-form`
- Global state:
  - `src/context/AuthProvider.tsx`
  - `src/context/ErrorProvider.tsx`
- Shared async lifecycle: `src/hooks/useFetch.ts`

---

## API Layer

### `src/services/api.ts`

- Hosts the shared Axios instance
- Sets `baseURL`, `withCredentials`, and request timeout
- Reports unauthorized responses through the shared auth flow
- `fetchData(...)` unwraps successful responses and normalizes failures to the shared `ApiError` shape

### `src/types/api.ts`

- Defines the frontend error contract:
  - `status`
  - `message`
  - optional `details.fields`

### `src/services/*`

- Service modules are the transport boundary
- Pages and components should call services, not Axios directly

---

## Error Handling Flow

- Backend returns `{ message, details?: { fields } }`
- `src/services/api.ts` converts transport failures into `ApiError`
- `src/hooks/useFetch.ts` handles default global display for non-field errors
- `src/utils/apiErrors.ts` extracts `details.fields` for inline form errors
- Form pages should keep validation errors inside the form and reserve the global banner for non-field failures

---

## UI Structure

- Pages: `src/pages/*`
- Shared components: `src/components/*`
- UI primitives: `src/components/ui/*`
- Shared validators/helpers: `src/utils/*`
- Global styles: `src/index.css`

---

## Build and Tooling

Scripts in `package.json`:

- `dev`
- `build` (`tsc -b && vite build`)
- `lint`
- `preview`

Vite handles local dev serving and proxying, and TypeScript runs in strict mode.

---

## Known Risks / Improvement Areas

- Some pages still need service-layer cleanup if they bypass the shared API pattern
- Large initial bundle; no route-level code splitting yet
- No automated test suite; regressions rely on lint + build + manual checks
- Time/date logic remains a likely source of edge-case bugs
