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

Notes:

- in local development, Vite proxies `/api` to `http://localhost:4000`
- in production builds, API requests use `VITE_BACKEND_URL`

## Architecture

See ARCHITECTURE.md for detailed architecture.

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
