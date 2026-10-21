# UI overhaul (branch `feat/ui-shadcn`)

Overnight run on top of `main` @ `7b46187`. Goal: introduce Radix/shadcn
primitives without changing the look (parchment `neutral`, green `primary`,
EB Garamond, `rounded-card`, `shadow-card`, `ring-primary-600` focus ring,
44px targets) or any backend contract. Every commit passed `npm run lint`
(0 errors), `npm run build` and `npm test`.

## What was done, per phase

| Phase | Commit | Summary |
| --- | --- | --- |
| 0 | `57cda2a` | Deleted stale `tailwind.config.cjs` / `postcss.config.cjs`. Verified first that the `.js` configs are the ones loaded (`neutral-300` exists only in `.js` and is in the built CSS). |
| 0 | `48f777b` | `@/*` → `src/*` alias (`tsconfig.app.json` + `vite.config.ts`, also used by Vitest). `src/lib/utils.ts` `cn()` (tailwind-merge taught about `rounded-card` / `shadow-card`). `Button` uses `cn()`; same API and classes. |
| 1 | `36fc040` | shadcn HSL variables on `:root` in `index.css`, converted from the existing hex palette (mapping is documented in a comment). `tailwind.config.js` extended with shadcn colors, `--radius`, accordion keyframes and `tailwindcss-animate`. Existing scales untouched. Built CSS diffed before and after: existing utilities resolve to the same values. |
| 2 | `1fcf591` | `shadcn/dialog.tsx`. `HistoryDialog` rebuilt on Radix with the same props. Still no close on outside click, the first form field gets focus, focus returns to the opener. `Button` props now include `ref`, so it works as an `asChild` trigger (tested). Global RTL `cleanup` added to the test setup. |
| 3 | `942b2fc` | `shadcn/alert-dialog.tsx` + `ui/ConfirmDialog` + `ui/useConfirm` (promise-based). Replaced: the `window.confirm` for deleting an event; the inline Ja/Nej confirms for delete group, remove group member and delete post; the inline "Skicka till N mottagare?" confirm for mailings. |
| 4 | `7596dc3` | `sonner` toasts (`shadcn/sonner.tsx`, mounted once in `AppLayout`). Toasts after: member edit, profile save (replaces the "Profil uppdaterad." banner), group create/update/delete, remove member, history add/edit/delete, mailing queued (replaces the inline status line). Errors still use the global banner; field errors are unchanged. |
| 5 | `9e0cfb7` | `shadcn/popover.tsx` + `shadcn/command.tsx` (cmdk). `UserSelection` is now a combobox: a trigger opens a search with members grouped by lodge ("Ingen loge" last). Arrows + Enter toggle a member, Escape closes. Selected members show as chips with "Ta bort &lt;namn&gt;" buttons. Members already covered by a lodge or group show as read-only. Props are unchanged. |
| 6 | `c03e85c` | `NavDropdown` ("Arkiv") is now a disclosure (`aria-expanded`/`aria-controls`, list of links, no `role=menu`). Escape closes it and returns focus. It also closes on an outside click, on blur and when a link is followed. The mobile menu toggle got `aria-controls`, a 44px size, and Escape returns focus to it. |
| 7 | `385ca48` | `shadcn/switch.tsx` + `shadcn/checkbox.tsx`. Tillgängligt boende, Befriad från årsavgift and Ständiga listan are switches (RHF `Controller`; `ProfileForm` gets a new `control` prop). The history-dialog date confirmations use the Radix checkbox. |
| 8 | `5e06d76` | `shadcn/badge.tsx` for mailing and recipient status and the archive marker. Inline skeleton divs now use `SkeletonBlock`. Change-log timestamps no longer show the ISO `T`. `...` → `…` in UI copy. |
| — | (this commit) | Removed the unused direct `@radix-ui/react-slot` dependency. Added this file. |

Tabs (part of phase 7) were deliberately **not** added; see the open questions.

## New dependencies

| Package | Version |
| --- | --- |
| clsx | ^2.1.1 |
| tailwind-merge | ^2.6.1 (v2 = Tailwind 3 compatible) |
| class-variance-authority | ^0.7.1 |
| tailwindcss-animate | ^1.0.7 |
| @radix-ui/react-dialog | ^1.3.1 |
| @radix-ui/react-alert-dialog | ^1.2.1 |
| @radix-ui/react-popover | ^1.3.1 |
| @radix-ui/react-switch | ^1.4.1 |
| @radix-ui/react-checkbox | ^1.4.1 |
| cmdk | ^1.1.1 |
| sonner | ^2.0.8 |

The main JS chunk grew from 512.9 kB to 570.1 kB (gzip: 162 → 179 kB). It was already over Vite's 500 kB warning before this work.

## Where things live

- `src/components/shadcn/` holds the shadcn components, in lowercase files: dialog, alert-dialog, popover, command, sonner, switch, checkbox, badge. They are kept apart from `src/components/ui/` because `Button.tsx` and `button.tsx` would collide on Windows.
- `src/components/ui/ConfirmDialog.tsx` and `src/components/ui/useConfirm.tsx` are project-level wrappers.
- Tailwind keeps the existing scales. The shadcn tokens (`bg-background`, `bg-popover`, `ring-ring`, …) also exist, but the new components use the project scales directly (`neutral-*`, `primary-*`) so they read like the rest of the code.
- `src/test/setup.ts` adds a global RTL `cleanup` and jsdom stubs (`ResizeObserver`, `scrollIntoView`, pointer capture) that Radix and cmdk need.

## Manual browser checklist

- [ ] **Member detail → edit** (Admin and Editor):
  - The three switches toggle with mouse, Space and a click on the label.
  - "Spara" enables after a toggle and is disabled again when the toggle is undone.
  - After saving, a toast reads "Medlemmen sparades.".
  - In a partial failure (for example a lodge error), the banner shows and no toast appears.
- [ ] **Member detail → Tjänster / Utmärkelser**:
  - Each dialog opens with focus in the first field. Tab stays inside it, Escape and ✕ close it, and focus returns to the button that opened it.
  - An outside click does **not** close it.
  - The date-confirmation checkboxes work.
  - Toasts appear after add, edit and delete.
  - The change log shows its timestamps correctly.
- [ ] **Profile → edit**: the toast "Profilen sparades." replaces the old green banner.
- [ ] **Admin → Grupper**:
  - Creating a group shows a toast.
  - On group detail, **Ta bort** opens a confirmation dialog: Avbryt has focus, Escape cancels, and confirming deletes the group, shows a toast and navigates away.
  - Removing a member opens a dialog that names the member, then shows a toast.
- [ ] **Group detail → Lägg till medlemmar**:
  - The trigger opens the search; typing filters the list (try å/ä/ö).
  - Arrows and Enter toggle members. Chips appear and their ✕ buttons remove members.
  - "Lägg till (n)" works.
  - Check performance with the full ~574 members in the list.
- [ ] **Event edit** (`/events/:id/edit`):
  - The audience member picker shows members covered by a lodge or group as "via annat val" (read-only), with a count under the chips.
  - **Radera** opens a dialog instead of the browser confirm.
- [ ] **Post edit**: **Radera** opens a dialog.
- [ ] **Group mailing**:
  - "Skicka utskick" opens a confirmation dialog with the subject.
  - Afterwards a toast appears and status badges show in "Tidigare utskick" and in the recipient lists.
- [ ] **Navigation**:
  - Desktop "Arkiv": opens and closes, Escape returns focus, Tab out closes it, and the links are 44px high.
  - Mobile menu: toggle works, Escape returns focus.
- [ ] **Reduced motion** (OS setting): dialogs, popover and toasts appear without animation.
- [ ] **Toasts** look right (bottom-right, white card, Garamond) and stay readable for about 6 s.

## Open questions / decisions for Viktor

1. **Tabs on member detail were skipped.**
   - The edit page is one `<form>` with a single "Spara" spread across two cards. Splitting it into tabs would hide fields that can carry validation errors, and would hide pending changes on another tab.
   - The history section (Tjänster / Utmärkelser / Ändringslogg) lives outside that form and could be tabbed safely. Say if you want that.
2. **"Radera" vs "Ta bort".** Events and posts say *Radera*; groups and history say *Ta bort*. The confirm dialogs follow the button that opened them. Pick one wording?
3. **Event registration has no toast.** It already shows the inline "Din anmälan är bekräftad." with a summary, and a toast would repeat it (and a screen reader would announce it twice). Add one anyway?
4. **Inline confirmations are now modal dialogs.** This applies to group delete, member remove, post delete and the mailing send. The mailing dialog is a `primary` (green) confirm, not danger. OK?
5. **Banners that were kept.** MembersPage's "Medlemmen skapades…" banner (it contains the e-mail address, so it should not vanish) and LodgeDetail's "Logen sparad." notice are unchanged. Convert "Logen sparad." to a toast too?
6. **Member picker search.**
   - Callers still get server-side search via `onSearchQueryChange`, and the list is also filtered client-side so typing feels instant.
   - Since `listAllUsers` already loads every member, server search could be dropped for this picker, which would mean fewer requests. That is a behaviour change, so it was not made.
7. **Logout two-step "Bekräfta?" button** in the navbar was left alone. It is not destructive. Should it become a ConfirmDialog?
8. **Dropdown links in "Arkiv" are now 44px tall**, per the touch-target rule. This is a small visual change.

## Known gaps

- Not checked in a real browser overnight (there was no backend). All verification is Vitest/jsdom plus build. Please run the checklist above.
- After removing a group member, the button that opened the dialog no longer exists, so focus falls back to the page body.
- Sonner's close (✕) button is smaller than 44px. Toasts also auto-dismiss, can be swiped away, and can be reached with Alt+T.
- Empty states with a "next action" (phase 8) were not reworked beyond what already existed.
- `MemberDetailSkeleton` / `PageSkeleton` were left as they are. Only the inline shimmer divs were consolidated. Two non-rounded image placeholders in PostsPage stay inline.
- `AudienceSelection` (lodge/group checkbox lists) still uses native checkboxes, by design.
- Lint still has the same 2 old warnings (CreateEvent `autoFocus`, GdprPage). There are no new warnings.

## Verification (final)

- `npm run lint`: 0 errors, 2 warnings (pre-existing)
- `npm run build`: OK
- `npm test`: 26 files, 90 tests passed (baseline: 19 files, 63 tests)
