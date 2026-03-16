# OSVS Frontend

React + TypeScript frontend for the OSVS platform.

## Stack

- React
- TypeScript
- Vite
- React Router
- Axios
- react-hook-form
- Tailwind-based utility styling

## Key Commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Environment

Frontend env template:

- [.env.example](./.env.example)

Current values:

- `VITE_BACKEND_URL`
- `VITE_SUPABASE_ANON_KEY`

Notes:

- in local development, Vite proxies `/api` to `http://localhost:4000`
- in production builds, API requests use `VITE_BACKEND_URL`

## Architecture

Important files:

- `src/main.tsx`
- `src/routes/Router.tsx`
- `src/routes/AuthGuard.tsx`
- `src/context/AuthProvider.tsx`
- `src/context/ErrorProvider.tsx`
- `src/services/api.ts`
- `src/styles/index.css`

Key frontend rules:

- page-level API calls should go through `src/services/*`
- protected routes go through `AuthGuard`
- field errors come from backend `details.fields`
- non-field failures go through the global error banner

## Routing

The router uses route-level lazy loading and suspense fallbacks from:

- [`src/routes/Router.tsx`](./src/routes/Router.tsx)

Protected routes are wrapped by:

- [`src/routes/AuthGuard.tsx`](./src/routes/AuthGuard.tsx)

## Verification

Local verification:

```bash
npm run lint
npm run build
```

CI workflow:

- [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)

There is currently no automated frontend test suite, so regressions are still
caught through lint, build, and manual verification.

## Development Notes

- global styles live in [`src/styles/index.css`](./src/styles/index.css)
- the shared axios layer is in [`src/services/api.ts`](./src/services/api.ts)
- the global error banner lives in
  [`src/context/ErrorProvider.tsx`](./src/context/ErrorProvider.tsx)
- `AuthGuard` currently redirects both unauthenticated and unauthorized users to
  `/login`

## Current Gaps

- no automated frontend tests yet
- some legacy localized strings still contain encoding issues
- date and time handling remains a risk area
- `MapPage` is still the largest lazy-loaded chunk
