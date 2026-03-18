# Frontend Agent Rules

This repository is the frontend for the OSVS application.

## Tech Stack, Architecture, and Commands

See README.md for stack and commands. See ARCHITECTURE.md for structure, routing,
and architecture map.

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

## API Rules

- in dev, requests go to `/api` through the Vite proxy
- in production, `VITE_BACKEND_URL` is used
- `withCredentials` must remain enabled
- unauthorized responses flow through the shared auth reporting logic in
  `src/services/api.ts`

## Build and Verification

See README.md for build commands and CI configuration.
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
