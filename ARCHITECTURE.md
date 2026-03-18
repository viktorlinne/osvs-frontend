# Frontend Architecture

## Overview

`osvs-frontend` is a React + TypeScript SPA built with Vite.

Core characteristics:

- routing via React Router
- auth and session state via context providers
- route-level lazy loading
- shared Axios API layer
- form handling with react-hook-form
- global non-field error banner plus inline field errors

## Entry Point

### `src/main.tsx`

- loads `src/styles/index.css`
- wraps the router with `ErrorProvider` and `AuthProvider`
- renders `RouterProvider`

## Layout and Routing

### `src/app/AppLayout.tsx`

- application shell
- navbar, outlet, footer

### `src/routes/Router.tsx`

- defines public and protected routes
- uses lazy-loaded route pages
- provides a suspense fallback for route transitions

### `src/routes/AuthGuard.tsx`

- waits for auth state
- redirects unauthenticated users to `/login`
- currently redirects role failures to `/login` as well
- runs session heartbeat logic for active sessions

## State Management

- local component state with React hooks
- form state with react-hook-form
- auth state in `src/context/AuthProvider.tsx`
- global non-field errors in `src/context/ErrorProvider.tsx`
- shared async loading flow in `src/hooks/useFetch.ts`

## API Layer

### `src/services/api.ts`

- hosts the shared Axios instance
- uses `withCredentials`
- uses `/api` in dev and `VITE_BACKEND_URL` in production
- reports unauthorized responses through the shared auth flow

### `src/services/*`

- service modules are the transport boundary
- pages should call services, not Axios directly

## Error Handling

- backend returns `{ message, details?: { fields } }`
- service and helper code preserve `details.fields`
- forms render field errors inline
- `ErrorProvider` displays non-field errors as a dismissible accessible alert

## Styling

- global styles live in `src/styles/index.css`
- reusable UI primitives live in `src/components/ui/*`
- button-styled links are used for navigation actions where appropriate

## Build and Tooling

Local commands:

- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run preview`

CI workflow:

- `.github/workflows/ci.yml`

There is still no automated frontend test suite.
