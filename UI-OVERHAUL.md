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

- ~~Not checked in a real browser~~: checked on night 2, see "Browser test (night 2)" below. The manual checklist is still worth a human pass.
- ~~Focus falls to the page body after removing a group member~~: fixed in `0a44c87`.
- ~~Sonner's close (✕) button is smaller than 44px~~: the hit area is 44×44px since `aba2117` and `faa1f2c`. Toasts also auto-dismiss, can be swiped away, and can be reached with Alt+T.
- ~~Empty states with a "next action" were not reworked~~: done in `a2e6571`.
- `MemberDetailSkeleton` / `PageSkeleton` were left as they are. Only the inline shimmer divs were consolidated. Two non-rounded image placeholders in PostsPage stay inline.
- `AudienceSelection` (lodge/group checkbox lists) still uses native checkboxes, by design.
- Lint still has the same 2 old warnings (CreateEvent `autoFocus`, GdprPage). There are no new warnings.

## Verification (final)

- `npm run lint`: 0 errors, 2 warnings (pre-existing)
- `npm run build`: OK
- `npm test`: 26 files, 90 tests passed (baseline: 19 files, 63 tests)

## Browser test (night 2)

The tests ran in real Chromium (Playwright, headless) against the dev servers:

- Frontend: `npm run dev` on port 5173, this branch.
- Backend: `C:\OSVS\osvs-backend` on port 4000, unchanged, branch `chore/ubuntu-deploy`. It ran with env overrides for the throwaway trial DB (`osvs-migration-trial`, port 3307) and for Mailpit (SMTP 127.0.0.1:1025, no auth, `MAIL_DEV_ALLOWLIST=@osvs.invalid`). The effective SMTP config was checked before anything was sent.
- Logins: `test.admin` (4089), `test.editor` (333) and `test.member` (308).

Where things are:

- Specs and tooling are outside the repo, in `C:\Users\VIKTOR~1\AppData\Local\Temp\claude\C--OSVS\a2d7cb2d-6a2e-433d-817f-0a4cfb4445dd\scratchpad\e2e\tests\`.
- Screenshots (60 of them, desktop 1280×800 and mobile 390×844) are in `C:\Users\VIKTOR~1\AppData\Local\Temp\claude\C--OSVS\a2d7cb2d-6a2e-433d-817f-0a4cfb4445dd\scratchpad\e2e\screenshots\`.
- The axe JSON for each page is in `C:\Users\VIKTOR~1\AppData\Local\Temp\claude\C--OSVS\a2d7cb2d-6a2e-433d-817f-0a4cfb4445dd\scratchpad\e2e\axe\`.

Final run: **16/16 tests passed**, split across two runs (see "Test notes").

### Part 1: known gaps fixed

| Commit | Fix |
| --- | --- |
| `0a44c87` | **Group detail focus.** After a member is removed, focus moves to the next row's "Ta bort", or to the previous row's if the last row was removed. When the group becomes empty, focus goes to the "Medlemmar" heading. Unit-tested (3 cases) and checked in the browser. |
| `aba2117`, `faa1f2c` | **Toast ✕.** An invisible `::before` makes the hit area 44×44px; the visible 20px circle is unchanged. Measured in the browser: the first version gave only 42px, because the inset is relative to the padding box. |
| `a2e6571` | **Empty states with a next action.** Each one has unit tests:<br>- Grupper: "Skapa grupp".<br>- Group members: "Lägg till medlemmar", which focuses the picker.<br>- Tidigare utskick: "Skriv ett utskick", which focuses Ämne.<br>- Möteskalender: "Skapa möte" for Admin/Editor, shown in the mobile list and under the desktop grid. Members get a hint to use Förra/Nästa.<br>- Nyheter: "Skriv det första inlägget" for Admin/Editor.<br>- Tjänster/Utmärkelser: the empty text points to "Lägg till". |

### Results per flow

**1. Login and navigation.** Pass after fixes (header layout, mobile menu). Checked:

- The login page shows the "Första gången…" hint, and the UI login as admin works.
- Navbar and "Arkiv" by keyboard: Enter opens it and sets `aria-expanded`, the links are 44px tall, Escape closes it and returns focus, and tabbing out closes it.
- Mobile menu: the toggle is 44px, Escape from inside the menu returns focus to the toggle, and following a link closes the menu.

**2. Member edit.** Pass. Checked:

- Searching the members list and opening 308: every image loads, including the profile photo.
- On the edit page, Befriad and Ständiga listan toggle with Space, with Enter and with a click on the label.
- "Spara" stays disabled until something changes, and is disabled again when the change is undone.
- Saving shows the "Medlemmen sparades." toast, and its ✕ responds to a click 18px off centre.
- The original values were saved back afterwards.

**3. History dialog ("Lägg till tjänst").** Pass; nothing was saved. Checked:

- Focus starts in Tjänst. 25 Tabs and 5 Shift+Tabs all stay inside the dialog.
- An outside click does not close it. Escape closes it and focus returns to "Lägg till"; Avbryt does the same.
- The date checkbox stays disabled until a start date exists.
- "För att spara:" lists 4 items, and the list empties once everything is filled in.

**4. Groups and mailing.** Pass. Checked:

- Creating a group shows the empty states.
- Combobox: Enter opens it, typing "skäremo" filters to 1 match, ↓ reaches #308 among 18 "nilsson" matches, and Enter toggles. Escape returns focus to the trigger. 4 chips appeared and one was removed with its ✕. "Lägg till (3)" added the rest.
- Removing the middle member: the dialog opens with Avbryt focused, and afterwards focus lands on the next row.
- Mailing: the preview says "2 mottagare", the confirm dialog shows the subject, and the toast says "lagts i kö". One mail-worker tick was then run.
- **Mailpit got exactly 2 messages, to test.admin@ and test.editor@osvs.invalid, and nothing else.**
- "Tidigare utskick" shows KLAR and "2 skickade".
- Deleting the group: Escape cancels the dialog with focus back on "Ta bort". Confirming navigates away and shows a toast.

**5. Events.** Pass after a fix (focus). Checked:

- As test.member: calendar, then November, then Mårtensloge (499). "Ändra anmälan" leads through Närvaro (Kommer is pressed), Mat (the switch works with Space) and Bekräfta; Tillbaka works. The result is "Din anmälan är bekräftad." The same values were chosen as before, so the DB is unchanged.
- As admin, on the create-event page: 2 lodges ticked by keyboard and click. The member picker shows 197 members as "via annat val", plus 1 explicit chip. **Not saved.**

**6. Posts.** Pass. Checked:

- Every image on the Nyheter list loads once the page is scrolled (they are lazy-loaded).
- Post 36: the picture loads and the text keeps its line breaks (`white-space: pre-line`, 17 lines, no HTML).
- Post 38 renders with an empty description.
- No horizontal overflow on mobile.

**7. axe.** Rules: wcag2a/aa, wcag21a/aa, wcag22aa and best-practice. Pages: login, members, member edit, group detail, and event detail as both admin and member. Results are in "axe findings remaining" below.

**8. Scroll position.** Pass after a fix. A member card far down the list opens the detail page at the top, and Back restores the list position.

On mobile (390×844) there is no horizontal overflow on any page tested: login, home, menu, members list, member detail and edit, groups, group detail, calendar, event and posts.

### Bugs found and fixed (frontend)

| Commit | Bug |
| --- | --- |
| `91a149b` | **Desktop header layout** (pre-existing on `main`). The menu-toggle grid cell was `display:none` on `lg`, so the logo sat in the left column and Profil/Logga ut in the middle. The logo is centred again, with the user menu on the right. |
| `91a149b` | **Mobile menu and password toggle.** The mobile menu had a stray "·" separator row, and its links were 30px tall (now 44px). The password show/hide button was 16×16px (axe `target-size`) and is now 44×44px with the same icon. |
| `174114b` | **Two `<main>` landmarks on every page.** AppLayout's `<main>` contained a second one from `PageContainer`'s default `as="main"`. `PageContainer` now defaults to `<div>`, which clears the axe rules `landmark-no-duplicate-main`, `landmark-main-is-top-level` and `landmark-unique` on all pages. |
| `174114b` | **"Inbjudna medlemmar" table.** 76 checkboxes had no name (axe `label`, critical). They are now named like "RSVP – Namn". The scrollable list is a focusable, named region (axe `scrollable-region-focusable`). |
| `174114b` | **Event registration focus.** "Ändra anmälan" and "Bekräfta" removed the clicked button, so focus fell to `<body>`. Focus now moves to the section heading. The food switch label is 44px tall. |
| `ef8e22b` | **No scroll handling.** A page opened from far down a list kept the old scroll offset, and so did the detail page after saving a member. Both could open showing the footer. `ScrollRestoration` is now keyed by pathname, so filter and page changes in the query string keep their position. |

### axe findings remaining (serious/critical)

No critical findings remain. These serious ones are left for a decision:

- **color-contrast** (every page; the palette):
  - `primary-600` #208f44 text on white is 4.13:1, and 3.9:1 on #faf8f4. This affects `ui-link` and the white text on `ui-btn-primary`. Normal text needs 4.5:1; `primary-700` would pass.
  - `neutral-400` #9b8e84 on small text is 2.7–3.2:1. Seen on "est. MCMXXIV", "Bild – ma…" and the muted "Inga …" texts.
  - `neutral-500` #796d63 at 12px is 4.31:1. Seen on the session countdown.
  - These are design-token choices, so they were not changed.
- **label-content-name-mismatch** (members list, 24 cards). Each card has `aria-label="Visa profil för <namn>"`, but its visible text also includes the initials and the lodge. Dropping the `aria-label` fixes it, but changes what screen readers announce.
- ~~Moderate: the member detail/edit page has no `<h1>` (`page-has-heading-one`).~~ Fixed in `fb3b490`.

### Backend findings (not changed; backend is read-only here)

1. **Every invitee's allergies and payment status are visible to any logged-in member.**
   - `GET /api/events/:id/attendances` has only `authMiddleware`.
   - As test.member, event 499 returns 19 rows with `allergies`, `paymentStatus` and `paymentPaid`. The UI shows them under "Inbjudna medlemmar".
   - Allergies are health data under GDPR, so this needs a product/GDPR decision. One option is to restrict the route, or those fields, to Admin/Editor.
2. **The refresh rate limit logs users out in the UI.**
   - `refreshLimiter` allows 30 requests per 15 min per IP, and every full page load calls `POST /auth/refresh`.
   - Past the limit, `/auth/refresh` returns 429. The frontend treats that as not logged in and shows "Logga in", even though the session is still valid.
   - Production sets `TRUST_PROXY=1`, so the limit is per client IP. Members behind one NAT, such as lodge Wi‑Fi, share it.
   - Decide whether the limit should be higher, or whether the frontend should show an error on 429 instead of logging out.
3. **`CRON_RUNNER=false` also turns off the mail worker**, so locally a mailing stays queued. The test ran one `runMailWorkerTick()` through a scratchpad script with the same env overrides. This is expected; it is noted for anyone repeating the test.

### Remaining issues and open questions (night 2)

1. Should the `primary` colour be darkened for text and buttons? See the contrast findings above.
2. Should the `aria-label` on the member cards be dropped? See above.
3. **Registration flow steps.** Moving between steps keeps focus on "Nästa", and the new question is not announced. The food choice is still a native checkbox with `role="switch"`: the box is 16px, though its label is now 44px. Should it become the Radix switch, or should focus move to the step question?
4. The `AudienceSelection` lodge/group labels are 38px tall, under 44px. So far this has been by design.
5. On mobile the tab order is toggle, then logo, then menu items, because the menu is rendered after the header. That works, but it could be reordered.
6. Back restores the members list only partly (356 of 688 px), because the list is still loading when the position is restored.
7. ~~"Skriv ett utskick" (the empty "Tidigare utskick" state) shows even when nobody in the group can receive mail.~~ Fixed in `dffd32d`: the button is hidden then.
8. **Test data.** Everything that was created has been removed: the test groups and their memberships, the 3 mailings with their outbox rows, and the 6 test messages in Mailpit. Member 308's flags are back to `feeExempt=0` and `standingList=1`, and the registration on 499 is unchanged. Refresh-token rows from the test logins remain in the trial DB.

### Test notes

- Refresh tokens rotate on every use, and `/auth/refresh` requires an `Origin` header. Playwright's global setup refreshes the saved session (or logs in), and each test writes the rotated cookies back.
- The login limit (15 per 15 min) and the refresh limit (30 per 15 min) are kept in memory, so the backend was restarted between runs to reset them.

### Verification (night 2)

- `npm run lint`: 0 errors, 2 warnings (the same pre-existing ones)
- `npm run build`: OK
- `npm test`: 30 files, 104 tests passed (night 1: 26 files, 90 tests)
- Playwright: 16/16 passed

## Logo green, payment visibility, tone of voice

Decisions by Viktor, three commits on top of `9422ebc`. This resolves open
questions 2, 3, 5 and 7 above, and night-2 question 1 (Viktor chose the logo
green over a darker, higher-contrast one).

| Commit | Summary |
| --- | --- |
| `f5c768c` | **Primary green = the logo, #00a460.** See the table below. `--primary` and `--ring` are `155.1 100% 32.2%`. The map's selected-pin glow and the green skeleton shimmer (oklch hue 149 → 156) follow. `C:\OSVS\DESIGN.md` (`ordensgreen*`) is updated too. |
| `cf7be4a` | **Payment status for Admin/Editor only.** The backend no longer sends `paymentStatus`/`paymentPaid` to members. The "Betalning" column in the attendance table is shown only when `canViewPayments` (Admin/Editor) is set, and the type fields are optional. 4 new tests. |
| `d2f3d78` | **Wording and tone of voice.** The style rules are below. Logout and the two map "Är du säker?" confirmations now use `ConfirmDialog`. "Logen sparad." and the map "Position sparad." lines are now toasts. 3 new Navbar tests. |

### The green scale

Every shade is on the logo's hue (HSL 155°). The hover and active shades
lower the lightness, and the tints keep the old tints' saturation and
lightness.

| Token | Old | New | HSL |
| --- | --- | --- | --- |
| `primary-50` | #eef7f1 | #eef7f3 | 153 36% 95.1% |
| `primary-100` | #d3eedd | #d3eee3 | 156 44% 88.0% |
| `primary-200` | #a8dbb8 | #a8dbc6 | 155 42% 75.9% |
| `primary-600` (base) | #208f44 | **#00a460** | 155.1 100% 32.2% |
| `primary-700` (hover) | #15803d | #008a51 | 155.2 100% 27.1% |
| `primary-800` (active) | #166534 | #006f41 | 155.1 100% 21.8% |

`success-*` (#16a34a/#15803d) is a separate status scale and was left alone,
and so was the map picker pin (`#16a34a`).

**Contrast (WCAG), measured:**

| Pair | Old #208f44 | New #00a460 |
| --- | --- | --- |
| White text on `primary-600` (primary buttons) | 4.14:1 | **3.24:1** |
| `primary-600` text on white (links, page titles) | 4.14:1 | **3.24:1** |
| `primary-600` text on parchment #faf8f4 | 3.90:1 | **3.06:1** |
| `primary-600` on `primary-50` | — | 2.97:1 |
| White on `primary-700` (hover) | — | 4.42:1 |
| White on `primary-800` (active) | — | 6.27:1 |

The trade-off: #00a460 meets 3:1, which is enough for large text (18.66px
bold or 24px and up, such as `ui-page-title`) and for UI components such as
the focus ring and the button shape. It does **not** meet the 4.5:1 that
WCAG AA requires for normal-size text. That covers button labels at 14px,
`ui-link` and small green text. axe `color-contrast` will report this on
every page, more often than before. As decided, which elements use primary
was **not** changed. If it ever needs to pass AA, the smallest change is to
use `primary-800` (#006f41, 6.27:1) only for small *text* (links), and keep
#00a460 for surfaces and large headings.

### Wording rules (mini style guide)

1. **Swedish, sentence case** everywhere ("Logernas kontakt", not "Logernas
   Kontakt"). Labels are rendered uppercase by CSS, not written that way.
2. **Deleting is "Ta bort"** (in progress: "Tar bort…"), never "Radera".
3. **Confirmations use `ConfirmDialog`**, never inline two-step buttons or
   `window.confirm`.
   - Title: a question with the object in definite form ("Ta bort mötet?",
     "Ta bort gruppen?", "Logga ut?").
   - Body: names the item in ”…” and states the consequence ("Mötet ”X” tas
     bort permanent, med alla anmälningar. Det går inte att ångra.").
   - Buttons: the bare verb ("Ta bort", "Skicka", "Logga ut") and "Avbryt".
     No "Ja, …" or "Bekräfta".
   - Use `variant="danger"` for destructive actions and `primary` otherwise
     (send a mailing, log out).
4. **Save buttons say "Spara"** (in progress: "Sparar…"). Create buttons say
   "Skapa …" (in progress: "Skapar…").
5. **Success = toast**, in the form "*Subjekt* har *particip*.":
   - Every edit: "Ändringarna har sparats."
   - Create, add or remove: name the thing, e.g. "Gruppen ”X” har skapats.",
     "Tjänsten har lagts till.", "Bo Ek har tagits bort ur gruppen.",
     "Positionen har tagits bort."
   - Exceptions are states, not transient saves, so they stay inline and
     get no extra toast: the event registration's "Din anmälan är
     bekräftad.", and the members list's "Medlemmen har registrerats. Ett
     mejl har skickats till …" (it contains the address).
6. **Errors are sentences with a full stop.**
   - Actions: "Kunde inte *verb objekt*." ("Kunde inte spara mötet.").
     Replaces "Misslyckades att …".
   - Loading: "*Sak* kunde inte laddas." ("Tjänsterna kunde inte laddas.").
   - Backend messages are shown as they are; these are only the frontend
     fallbacks.
7. **Terminology.**
   - "möte" for events in all UI text.
   - "loge", "grad", "tjänst", "utmärkelse".
   - "medlem" for the register and administration: lists, filters,
     pickers, roles, "Ny medlem", "Välj medlemmar", "Medlemmen hittades
     inte".
   - "broder/bröder" when brothers are referred to collectively in lodge
     life: "Inbjudna bröder", "synligt för bröder i valda loger".
   - Avoid English and IT words: "Kommer", not "RSVP"; "medlemmar", not
     "användare"; "Välj loger", not "Associera loger".
   - Routes and data names are unchanged.
8. **Typography.**
   - Ellipsis is "…" (U+2026), never "...".
   - Quote item names with ” ” (U+201D on both sides, as Swedish does).
   - Separators are "·" or an en dash "–", not a hyphen.
   - Dates are sv-SE (`2026-10-22`, `toLocaleDateString("sv-SE")`).
9. "Redigera" opens an edit mode for a whole page or record, and "Ändra"
   edits a row inside a list (history entries, position). This is the
   existing usage, written down here.

### Strings that changed in the checklists above

- "Medlemmen sparades.", "Profilen sparades." and "Gruppen sparades." are now
  "Ändringarna har sparats.".
- The **Radera** buttons on event and post edit are now **Ta bort**.
- The mailing confirmation button is now "Skicka", not "Ja, skicka".
- The attendance table is now titled "Inbjudna bröder", and its "RSVP"
  column is now "Kommer". ~~The e2e specs in the scratchpad still use the old
  names~~: the specs now use the current wording (see "UI leftovers" below).

### Left for Viktor

1. **Contrast.** ~~Small green text is below AA~~: text now uses `primary-800`
   (see "Text contrast" below). Button labels on the logo green are still
   3.24:1, kept by decision.
2. ~~**Tailwind classes that do nothing.**~~ Fixed in `9a3b378`.
3. ~~**DESIGN.md** still lists an older Material-style palette.~~ Fixed (the
   file is not in git).
4. ~~**Content pages were not edited.**~~ Fixed in `c1e9de6`.
5. ~~**Mixed labels.**~~ Fixed in `c1e9de6`.
6. ~~**Focus after a successful map-position removal** falls to the page
   body.~~ Fixed in `04d1f19`.

### Verification (logo green / payments / wording)

- `npm run lint`: 0 errors, 2 warnings (the same pre-existing ones)
- `npm run build`: OK
- `npm test`: 30 files, 111 tests passed (before: 30 files, 104 tests)

## UI leftovers

Fixes for "Left for Viktor" 2–6 and the polish items from the night-2 list,
on branch `fix/ui-polish` on top of `0f6c4e0`.

| Commit | Summary |
| --- | --- |
| `9a3b378` | **Undefined Tailwind classes.** Every class in `src/` was checked against the built CSS (script: Tailwind build, then each utility-like token in a string literal is looked up). Nine produced no CSS; they now use existing tokens. No new tokens were added. `primary-400` (CreateMember current step) → `primary-200`, between `primary-600` (done) and `neutral-200` (to do). `primary-400` (EventsPage "·") → `primary-600`. `primary-500`/`danger-400` (file-input drag-over) → `primary-600`/`danger-600`. `border-warning bg-warning-pale` (LodgeDetail, SetPasswordPage) → `border-warning-600/30 bg-warning-50`, as the warning badge. `text-ink-mid`/`text-ink-secondary` → `neutral-700`/`neutral-600`. `hover:text-success-800` on the members-list notice ✕ → a 44px button with `hover:bg-success-600/10`. |
| `c1e9de6` | **Wording.** The name is **"Ordenssamfundet VS"** everywhere in the UI (page title, header and logo alt, footer, login, forgot/set password, About, Contact, GDPR), as on the old site. AboutPage: "Initialerna", "avslöjas", "Ordenssamfundet VS:s" (was "Ordenssamfundets VS:s"), "Orden" (was "Ordern"), ”sin loge”. ContactPage: office titles in lower case; "Kontakt" is now the page's `<h1>`. An event's price is **"Avgift"** in the create and edit forms too (and "Avgiften måste vara 0 eller större"); the edit form's hint gets its full stop. Members list: "Inga medlemmar hittades." with a full stop, and the empty card only mentions filters when a filter is active. GDPR document viewer ✕ is 44px. |
| `dffd32d` | **Mailing empty state.** "Skriv ett utskick" is hidden when nobody in the group can receive mail. 1 test extended. |
| `04d1f19` | **Map focus.** Saving, removing or cancelling a manual position moves focus to "Ändra position"/"Ange position manuellt"; entering edit mode moves it to the "Klicka i kartan…" hint (`tabIndex=-1`). Before, all four fell to `<body>`. 3 tests (they fail without the fix). |
| `fb3b490` | **h1 on member detail and profile.** The member's name in the profile header is the `<h1>`, same styling. |

`C:\OSVS\DESIGN.md` (not in git): the `colors` block now lists exactly the
Tailwind scales (`primary` 50/100/200/600/700/800, `neutral` 50–700 and 900,
`success`/`warning`/`danger` 50/600/700), each with its Tailwind token in a
comment. The old Material-style palette (`surface-*`, `primary: #006b2d`,
`tertiary-*` and so on) and the duplicate `display-lg` … `label-caps`
typography entries were removed. The name there is "Ordenssamfundet VS" too.
`PRODUCT.md` still spells it "Ordensamfundet VS" and was not edited.

The Playwright specs in the scratchpad (`e2e	ests\`) now use the current
wording: logo "Ordenssamfundet VS logotyp", "Ändringarna har sparats.",
"Gruppen ”X” har skapats./har tagits bort.", "3 medlemmar har lagts till.",
"X har tagits bort ur gruppen.", the "Skicka" button and the "Ta bort
gruppen?" dialog. They contained no "RSVP – …", "Inbjudna medlemmar" or
"Radera" selectors. They were not run (no backend).

### Still open

- Contrast of the logo green for small text (Left for Viktor 1).
- Open questions 1, 4, 6 and 8, and night-2 questions 2–6: product or UX
  decisions (member-card `aria-label`, registration step focus and the native
  food checkbox, 38px audience labels, mobile tab order, partial scroll
  restore on the members list).
- AboutPage wording that may be old but is not a clear typo was kept: "nån",
  "VS tvingar inga medlemmar någon viss religionsuppfattning" (perhaps
  "påtvingar"), "Damklubbens i logen insatser".
- Lint: the same 2 warnings (CreateEvent `autoFocus`, GdprPage overlay).

### Verification (UI leftovers)

- `npm run lint`: 0 errors, 2 warnings (the same pre-existing ones)
- `npm run build`: OK
- `npm test`: 31 files, 114 tests passed (before: 30 files, 111 tests)

## Text contrast (2026-10-22)

Decision: the logo green #00a460 (`primary-600`) stays for the logo, buttons,
focus rings, checkboxes and large headings. Only text colours changed. No
tokens were added or changed.

| Element | Before | After |
| --- | --- | --- |
| `ui-link` (and its hover) | `primary-600` 3.06:1 on #faf8f4, hover `primary-700` 4.16:1 | `primary-800` 5.91:1 (6.27:1 on white); hover only underlines |
| Footer link hover | `primary-700` 4.42:1 on white | `primary-800` 6.27:1 |
| Active nav item / "Arkiv" item, event calendar chips, post "Logemöte" chip, Publicum selection (on `primary-50`) | `primary-700` 4.05:1 | `primary-800` 5.74:1 |
| Posts list chapter label, lodge name hover, revision hover | `primary-600` 3.06–3.24:1 | `primary-800` 5.91–6.27:1 |
| Member initials (on `primary-100`), achievement date | `primary-700` 3.60 / 4.05:1 | `primary-800` 5.11 / 5.74:1 |
| Membership "Utestående" | `warning-600` 3.0:1 | `warning-700` 4.73:1 (5.02:1 on white) |
| Navbar session countdown (on `neutral-100`) | `neutral-500` 4.31:1 (axe saw `neutral-400` 2.73:1 earlier) | `neutral-600` 6.54:1 |
| Navbar "est. MCMXXIV" (10px, `neutral-100`) | `neutral-400` 2.73:1 | `neutral-600` 6.54:1 |
| Footer "est. MCMXXIV" (white) | `neutral-400` 3.18:1 | `neutral-500` 5.02:1 |
| File-input "Bild/PDF" and "eller dra hit" | `neutral-400` 3.0:1 | `neutral-500` 4.74:1 (4.60:1 on `primary-50` drag-over) |
| Payments table "—" | `neutral-400` 3.18:1 | `neutral-500` 5.02:1 |

axe `color-contrast` (Playwright, admin, desktop 1280 and mobile 390, pages:
login, posts, events, event detail, members, map, profile, memberships, both
admin payment pages, revisions, lodges, GDPR, mobile menu): the only
remaining violations are white text on #00a460, kept by decision: the
`ui-btn-primary` labels (3.24:1) and the date badges on the events page
(white 3.24:1, the month label at `opacity-70` 2.3:1).
