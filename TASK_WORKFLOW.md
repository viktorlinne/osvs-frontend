# Frontend Task Workflow

This document defines the default workflow for work in `osvs-frontend`.

## Step 0 - Identify Impact

Before coding:

- identify affected pages in `src/pages/*`
- identify affected services in `src/services/*`
- check whether routing changes are needed in `src/routes/Router.tsx`
- check whether auth or role gating is involved in `src/routes/AuthGuard.tsx`
- check whether backend `message` or `details.fields` handling affects the UI

Output:

- short plan
- files to change
- API endpoints involved
- UI states impacted
- verification steps

## Step 1 - Service Boundary First

If API behavior or payloads change:

1. update the relevant `src/services/*` module
2. keep transport concerns inside the service layer
3. preserve backend `details.fields`
4. avoid page-level direct Axios calls

## Step 2 - UI Implementation

Implement UI changes in pages and components while preserving:

- loading
- error
- empty
- success

For forms:

- map backend field errors inline
- keep the global banner for non-field failures
- avoid invalid button or link nesting
- use explicit button types when the action is not submission

For data loading:

- prefer `useFetch` unless the feature already follows a better local pattern

## Step 3 - Auth and Routing

- protected routes must keep using `AuthGuard`
- role-gated routes should follow current Admin/Editor patterns
- preserve current unauthorized flow unless the task explicitly changes it

## Step 4 - Type Safety

- prefer typed DTOs and normalized service returns
- avoid broad casts like `as unknown as`
- if backend data is uncertain, add narrow runtime checks in the service layer

## Step 5 - Verification

Current frontend verification relies on:

```bash
npm run lint
npm run build
```

CI exists, but there is still no automated frontend test suite.

Always provide a manual checklist covering:

- happy path
- loading state
- empty state when relevant
- non-field error behavior
- inline field error behavior for forms
- role or auth behavior when relevant

## Output Format

Use:

- `PLAN`
- `CHANGES`
- `API NOTES`
- `UI STATES`
- `AUTH NOTES` when relevant
- `VERIFICATION`
- `RISKS / NOTES`
