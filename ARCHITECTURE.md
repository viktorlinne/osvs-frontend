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
  (`src/services/apiBaseUrl.ts`; empty/unset means same origin)
- `fetchData` normalises every failure to an `ApiError`: no response
  (offline/timeout) becomes status 0 with a Swedish message, and proxy HTML
  error pages (nginx 502/504) are never shown verbatim
- multipart uploads get a 120 s timeout instead of the default 10 s
- reports unauthorized responses through the shared auth flow
- on a 401 while a session is active, renews once via `/auth/refresh` and
  retries the request; `renewSession()` keeps at most one renewal
  (refresh or heartbeat) in flight per tab, and a Web Lock serialises tabs,
  because the backend rotates the refresh token and only one of two
  parallel renewals with the same token wins (the loser gets a 401)
- only a 401 from the renewal logs the user out; a 429 (rate limited) keeps
  the auth state and surfaces a Swedish "try again later" message
- logout: `/auth/logout` revokes via the refresh cookie and works with an
  expired access token; a 401 there still renews once and retries; local
  state is always cleared and a failed server logout is reported

### Session lifecycle

- app start: `restoreSession()` calls `/auth/me` with the existing access
  cookie and refreshes only if that returns 401 (no refresh per page load)
- while active: `AuthGuard` sends `/auth/heartbeat` at most every 60 s after
  user activity; the inactivity timeout is enforced by the backend and by the
  local expiry timer

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

Tests: `npm test` (Vitest + Testing Library, jsdom).
