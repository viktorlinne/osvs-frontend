# Frontend Task Workflow (Codex / Agent Operating Procedure)

This is the standard procedure for implementing features safely and consistently in this frontend repo.

## Standard Workflow (Always Follow)

### Step 0 - Identify Impact

Before coding:

- Identify affected pages in `src/pages/*`
- Identify affected services in `src/services/*`
- Confirm whether routing changes are needed in `src/Router.tsx`
- Confirm whether auth / roles apply (`AuthGuard` and existing role-gating patterns)
- Confirm whether backend `message` / `details.fields` handling affects the UI

Output:

- Short plan:
  - files to change
  - API endpoints involved
  - UI states impacted
  - verification steps

---

### Step 1 - API First (Frontend Perspective)

If an endpoint or payload changes:

- Prefer updating or adding a service method in `src/services/*`
- Ensure it goes through `fetchData` / shared Axios in `src/services/api.ts`
- Avoid adding any new page-level Axios calls
- Preserve backend field errors from `details.fields`

Output:

- Service method signature + endpoint + DTO shape

---

### Step 2 - UI Implementation

- Implement UI changes in pages / components
- Use existing component patterns and styling conventions
- Ensure all relevant UI states exist:
  - loading
  - error (global + local)
  - empty
  - success

If forms are involved:

- map backend `details.fields` inline with `applyApiFieldErrors(...)`
- keep field validation errors inside the form
- use the global banner only for non-field failures

If data fetching is needed:

- Prefer `useFetch` unless there is a better existing pattern in that feature area

Output:

- UI behavior summary per state

---

### Step 3 - Auth and Authorization

- Protected routes must use existing `AuthGuard` patterns
- Role-gated pages must follow existing role gate patterns
- Ensure unauthorized behavior stays consistent with the shared auth flow

Output:

- Auth / role behavior notes

---

### Step 4 - Type Safety Rules

- Do not weaken types by adding broad casts
- Prefer explicit DTO types in services
- If backend contract is uncertain:
  - add narrow runtime checks in the service normalization layer
  - produce a clear error message
- If the backend returns `details.fields`, preserve that shape so forms can render the errors inline

Output:

- Types added / updated and where they live

---

### Step 5 - Verification

Since there is no test suite:

- Always run:
  - `npm run lint`
  - `npm run build` (or `npm.cmd run build` if PowerShell blocks `npm.ps1`)
- Provide a manual verification checklist:
  - steps
  - expected UI behavior
  - edge cases (unauthorized, missing data, validation errors)
  - confirm field errors render inline instead of only in the global banner

Output:

- Commands + manual checklist

---

## How to Split Work Into "Specialists"

When a change spans multiple concerns, treat it as tracks:

1. API / service track

- service module updates, DTO normalization, `ApiError` handling

2. UI track

- pages / components changes + UI states

3. Routing / auth track

- router changes, guard / role-gating updates

4. Verification track

- lint / build + manual steps

Merge in this order:
1 -> 2 -> 3 -> 4 -> 5

---

## Output Format (Use Every Time)

PLAN
CHANGES (by file)
API NOTES (endpoints + payloads)
UI STATES (loading/error/empty/success)
AUTH NOTES (if applicable)
VERIFICATION (commands + manual checklist)
RISKS / NOTES
