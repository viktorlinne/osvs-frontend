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

Unit and component tests run with Vitest (`npm test`). UI changes
still need a manual check in the browser.

## Development Notes

- global styles live in [`src/styles/index.css`](./src/styles/index.css)
- the shared axios layer is in [`src/services/api.ts`](./src/services/api.ts)
- the global error banner lives in
  [`src/context/ErrorProvider.tsx`](./src/context/ErrorProvider.tsx)
- `AuthGuard` redirects unauthenticated users to `/login` and users without the
  required role to `/forbidden`

## Current Gaps

- some legacy localized strings still contain encoding issues
- date and time handling remains a risk area
- Leaflet (~150 kB) is the largest lazy chunk; it loads only on `/map` and when
  editing the map pin on the profile
