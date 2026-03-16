# Frontend Agent Rules

This repository is the frontend for the OSVS application.

## Tech Stack

- React + TypeScript
- Vite
- React Router
- Axios
- react-hook-form

## Architecture Map

- entrypoint: `src/main.tsx`
- app shell: `src/app/AppLayout.tsx`
- routing: `src/routes/Router.tsx`
- auth guard: `src/routes/AuthGuard.tsx`
- auth state: `src/context/AuthProvider.tsx`
- global non-field error state: `src/context/ErrorProvider.tsx`
- async fetch helper: `src/hooks/useFetch.ts`
- shared API layer: `src/services/api.ts`
- global styles: `src/styles/index.css`

## Current Conventions

1. Prefer existing patterns. Do not introduce Redux, Zustand, React Query, or
   new UI/state frameworks unless explicitly requested.
2. API calls must go through `src/services/*` and `src/services/api.ts`.
   Do not add page-level direct Axios usage.
3. Preserve the current UI state model:
   - loading
   - error
   - empty
   - success
4. Preserve backend field errors from `details.fields` and map them inline in
   forms.
5. Reserve the global error banner for non-field failures.
6. Keep auth behavior consistent with `AuthGuard`.
7. Avoid invalid interactive nesting such as links inside buttons.
   Use button-styled links for navigation actions.
8. Avoid weakening types with broad casts.

## Routing Rules

- public and protected routes are defined in `src/routes/Router.tsx`
- routes are lazy-loaded with suspense fallbacks
- role-gated create and edit routes should keep following the existing
  Admin/Editor patterns

## API Rules

- in dev, requests go to `/api` through the Vite proxy
- in production, `VITE_BACKEND_URL` is used
- `withCredentials` must remain enabled
- unauthorized responses flow through the shared auth reporting logic in
  `src/services/api.ts`

## Build and Verification

Always run:

```bash
npm run lint
npm run build
```

CI exists in:

- `.github/workflows/ci.yml`

There is still no automated frontend test suite, so manual verification remains
required for UI changes.

## Output Format

Use:

- `PLAN`
- `CHANGES`
- `API NOTES`
- `UI STATES`
- `AUTH NOTES` when relevant
- `VERIFICATION`
- `RISKS / NOTES`
