# Frontend Task Workflow (Codex / Agent Operating Procedure)

This is the standard procedure for implementing features safely and consistently in this frontend repo.

## Standard Workflow (Always Follow)

### Step 0 — Identify Impact

Before coding:

- Identify affected pages in `src/pages/*`
- Identify affected services in `src/services/*`
- Confirm whether routing changes are needed in `src/Router.tsx`
- Confirm whether auth/roles apply (AuthGuard / role gating patterns)

Output:

- Short plan:
  - files to change
  - API endpoints involved
  - UI states impacted
  - verification steps

---

### Step 1 — API First (Frontend Perspective)

If an endpoint or payload changes:

- Prefer updating/adding a service method in `src/services/*`
- Ensure it goes through `fetchData` / shared axios in `src/api/api.ts`
- Avoid adding any new page-level axios calls

Output:

- Service method signature + endpoint + DTO shape

---

### Step 2 — UI Implementation

- Implement UI changes in pages/components
- Use existing component patterns and styling conventions
- Ensure all relevant UI states exist:
  - loading
  - error (global + local)
  - empty
  - success

If data fetching is needed:

- Prefer `useFetch` unless there is a better existing pattern in that feature area

Output:

- UI behavior summary per state

---

### Step 3 — Auth & Authorization

- Protected routes must use existing AuthGuard patterns
- Role-gated pages must follow existing role gate patterns
- Ensure unauthorized behavior:
  - redirects to `/login`
  - shows global error banner as per current conventions

Output:

- Auth/role behavior notes

---

### Step 4 — Type Safety Rules

- Do not weaken types by adding broad casts
- Prefer explicit DTO types in services
- If backend contract is uncertain:
  - add narrow runtime checks in the service normalization layer
  - produce a clear error message

Output:

- Types added/updated and where they live

---

### Step 5 — Verification

Since there is no test suite:

- Always run:
  - `npm run lint`
  - `npm run build` (or `npm.cmd run build` if PowerShell blocks npm.ps1)
- Provide manual verification checklist:
  - steps
  - expected UI behavior
  - edge cases (unauthorized, missing data, validation errors)

Output:

- Commands + manual checklist

---

## How to Split Work Into “Specialists”

When a change spans multiple concerns, treat it as tracks:

1. **API/service track**

- service module updates, DTO normalization

2. **UI track**

- pages/components changes + UI states

3. **Routing/auth track**

- Router.tsx changes, guard/role gating

4. **Verification track**

- lint/build + manual steps

Merge in this order:
1 → 2 → 3 → 4 → 5

---

## Output Format (Use Every Time)

PLAN
CHANGES (by file)
API NOTES (endpoints + payloads)
UI STATES (loading/error/empty/success)
AUTH NOTES (if applicable)
VERIFICATION (commands + manual checklist)
RISKS / NOTES
