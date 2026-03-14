# Frontend Agent Rules (osvs-frontend)

This repository is the frontend for a full-stack application.

Tech stack:

- React + TypeScript
- Vite
- Axios
- react-hook-form

## Architecture Map

- Entrypoint: `src/main.tsx` (wraps `RouterProvider` with `ErrorProvider` + `AuthProvider`)
- App shell/layout: `src/components/layout/AppLayout.tsx` (Navbar + Outlet + Footer)
- Routing: `src/Router.tsx` using `createBrowserRouter`
- Auth guard: `src/components/auth/AuthGuard.tsx`
- Global error UI/state: `src/context/ErrorProvider.tsx`
- Auth state: `src/context/AuthProvider.tsx`
- Shared async pattern: `src/hooks/useFetch.ts`
- Axios + interceptors + error normalization: `src/services/api.ts`
- Service modules: `src/services/*` (users/events/posts/etc.)
- Pages: `src/pages/*`
- UI primitives: `src/components/ui/*`

## Project Conventions (Follow These)

1. Prefer existing patterns. Do not introduce Redux/Zustand/React Query unless explicitly requested.
2. API calls must go through the shared axios layer in `src/services/api.ts` and service modules in `src/services/*`.
   - Do not add page-level direct axios calls. If found, refactor into a service function.
3. Maintain consistent UI states on data-fetch pages:
   - loading / error / empty / success
     Use `useFetch` where applicable and the global error banner via `ErrorProvider` for non-field errors.
4. Form/API error handling is standardized:
   - backend field errors come as `details.fields`
   - form pages should map them inline with `applyApiFieldErrors(...)`
   - reserve the global banner for non-field failures
5. Keep auth behavior consistent:
   - protected routes use `AuthGuard`
   - role-gated routes follow existing role guard usage (Admin/Editor on create/edit flows)
6. Type safety:
   - Avoid `as unknown as` casting and broad unions unless unavoidable.
   - Prefer defining/using typed DTOs from service modules.
   - If backend contract is unclear, add a narrow runtime check and log a clear error.
7. Language:
   - User facing hardcoded texts in pages,components,server messages and errors should be swedish localized.
   - Make sure usage of å,ä,ö is properly applied and not replaced with o, alt codes, special characters or other placeholders

## API Rules

- Base API prefix is `/api` (dev proxied via Vite; prod uses `VITE_BACKEND_URL`).
- Axios must use `withCredentials` and rely on the existing 401 unauthorized reporting/interceptor flow in `src/services/api.ts`.
- New endpoints or payload changes should be reflected in the service modules (and OpenAPI if maintained on backend).

## Build / Verification

- Commands:
  - `npm run lint`
  - `npm run build` (runs `tsc -b && vite build`)
- Note: In some PowerShell setups, use `npm.cmd run ...` if `npm.ps1` is blocked.
- Provide a manual verification checklist for every feature (steps + expected UI behavior).

## Output Format

For each task, respond with:
PLAN
CHANGES (by file)
API NOTES (endpoints + payloads)
UI STATES (loading/error/empty/success)
VERIFICATION (commands + manual checklist)
RISKS / NOTES
