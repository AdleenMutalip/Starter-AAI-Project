# Login – Tasks

> **This file answers:** In what order do we build it, and how do we check each step?
> **Who:** The AI drafts it. You review it.
>
> Build one task at a time, in order. When a task is done, the AI changes its
> Status to Done. At the end, you check the whole app against the specs.
> If something is wrong, fix the spec first, then ask the AI to rebuild.
>
> Sources: `01-requirements.md` (U1–U11 / AC-01–AC-11), `02-design.md`
> (rules 1–10, file map §5), `docs/Agentic AI - HRMS Doc.pdf` (§7.1–§7.5),
> and the login interview of 2026-11-20. Every task traces back to these.

**Priority.** Every task is **High**, **Medium** or **Low**. Do High first.
Do Low only if time is left, and only if you ask.

| Status | # | Task | Priority | Checks (from requirements §4) |
|--------|---|------|----------|-------------------------------|
| Done | 1 | Database and Users table | High | feeds AC-06 (design §1, §7) |
| Done | 2 | Seed the six demo users | High | AC-06 |
| Done | 3 | Login page (form only) | High | AC-11 (U11, design §4) |
| Done | 4 | Sign-in: bcrypt check + session cookie | High | AC-02, AC-08, AC-09 |
| Done | 5 | Role home pages + root redirect | High | AC-01 |
| Done | 6 | Server-side access control | High | AC-03, AC-04, AC-10 |
| Done | 7 | Logout | High | AC-05 |
| Done | 8 | Rate-limit failed logins | High | AC-07 |
| Done | 9 | Whole-module check, lint, README | Medium | all AC-01…AC-11 |

---

## Task 1 – Database and Users table *(High)*

> First database step: the schema exists before anything can read or write a user.

- **Goal:** Prisma is wired to a SQLite file and the `User` table of design §1 exists
  with all nine fields, unique `email` and unique `icNumber`.
- **Files:** `prisma/schema.prisma`, `.env`, `.env.example`, `package.json`
  (`db:migrate` script), `.gitignore` (add `prisma/dev.db`, `.env`).
- **Check:**
  • Run `npx prisma migrate dev` (and `npm install` first if needed) — it creates `prisma/dev.db` and the `User` table.
  • Open `npx prisma studio` — the `User` table shows the fields of design §1: name, icNumber, email, passwordHash, role, division, designation, createdAt.
  • In Studio try to add two users with the same email — the second insert is rejected (unique constraint).
  • Confirm `prisma/dev.db` and `.env` do **not** appear in `git status`.

## Task 2 – Seed the six demo users *(High)*

> Database step two: the demo people from document §7.2, so every later check can be repeated.

- **Goal:** `npm run db:seed` creates the six users of design Reference B with
  `bcrypt.hashSync('password123')` hashes, correct roles, divisions and designations; re-running is safe.
- **Files:** `prisma/seed.ts`, `package.json` (`db:seed` script using `tsx`).
- **Check:** AC-06.
  • Run `npx prisma migrate dev`, then `npm run db:seed`.
  • In `npx prisma studio` the User table has exactly the six Reference B rows (emails, names, IC numbers, roles, divisions).
  • Look at `passwordHash` — it starts with `$2b$` (a bcrypt hash), and nowhere is the text `password123` stored.
  • Run `npm run db:seed` twice in a row — still exactly six users, no duplicates.

## Task 3 – Login page, form only *(High)*

- **Goal:** `/login` shows email + password fields, a "Remember me" tick and a Sign in
  button, styled with Tailwind; submitting does nothing yet (the action comes in Task 4).
- **Files:** `src/app/login/page.tsx`.
- **Check:** AC-11 (also design §4 row `/login`).
  • Start `npm run dev`, open http://localhost:3000/login.
  • You should see exactly: one email field, one password field (dots when typing), a "Remember me" checkbox, a Sign in button.
  • Type into the fields, navigate away and back — the form is empty again.
  • No demo accounts, hints or error text are visible on the empty page.

## Task 4 – Sign-in: password check and session cookie *(High)*

- **Goal:** Signing in checks the email format, compares the password with bcrypt, and
  sets the signed `session` cookie (30 days with Remember me, browser session without);
  any failure shows one generic message.
- **Files:** `src/lib/passwords.ts`, `src/lib/auth.ts`, `src/app/login/actions.ts`.
- **Check:** AC-02, AC-08, AC-09 (U1–U2, U8–U9, design rules 2–5).
  • Sign in as `employee-1@budiman.com` / `password123` — DevTools shows a `session` cookie, `HttpOnly`, `SameSite=Lax`, no expiry (browser session).
  • Wrong password → "Email or password is wrong"; unknown `nobody@budiman.com` → **identical** message (AC-02).
  • Enter `someone@gmail.com` → the form says to use a `@budiman.com` work email and no cookie is set (AC-09).
  • Tick "Remember me" and sign in — the `session` cookie now expires about 30 days out (AC-08).
  • Edit the cookie value by one character in DevTools and reload — you are treated as logged out (signature check, design rule 4).

## Task 5 – Role home pages and root redirect *(High)*

- **Goal:** `/employee`, `/supervisor`, `/hr`, `/admin` render a heading + Log out
  button placeholder behind a shared layout; `/` redirects to the right place;
  successful login lands on the user's role home.
- **Files:** `src/app/(home)/layout.tsx`, `src/app/(home)/employee/page.tsx`,
  `…/supervisor/page.tsx`, `…/hr/page.tsx`, `…/admin/page.tsx`, `src/app/page.tsx`,
  `src/app/login/actions.ts` (redirect to role home).
- **Check:** AC-01 (U1, U4-adjacent, design §4).
  • Sign in as each of the six demo users: `employee-1` lands on `/employee`; each supervisor on `/supervisor`; `hr-1` and `hr-2` on `/hr`; `admin` on `/admin`.
  • Open http://localhost:3000/ logged in → your own home page; logged out → `/login`.
  • Each home page shows the role name and a Log out button (the button works properly in Task 7).

## Task 6 – Server-side access control *(High)*

- **Goal:** Every page and the login form check the verified cookie **on the server**:
  not logged in → `/login`; wrong role → silently back to own home; logged-in visitor
  at `/login` → own home (design rules 4 and 6, FR-01).
- **Files:** `src/app/(home)/layout.tsx` (guard), `src/app/login/page.tsx` (bounce when logged in), `src/lib/auth.ts` (guard helper used by both).
- **Check:** AC-03, AC-04, AC-10 (U3, U4, U10).
  • In a private window (logged out), open `/employee`, `/supervisor`, `/hr`, `/admin` — every one lands on `/login` (AC-03).
  • Sign in as `hr-1@budiman.com`, type `/employee` in the address bar → bounced to `/hr`, no "access denied" page; try `/admin` → still `/hr` (AC-04).
  • Still signed in as HR, open `/login` → bounced to `/hr`, the form never renders (AC-10).
  • Disable JavaScript in the browser and repeat the address-bar tests — same results (the check is server-side).

## Task 7 – Logout *(High)*

- **Goal:** The Log out button deletes the session cookie via a server action and
  returns to `/login`; Back button cannot resurrect the session.
- **Files:** `src/app/(home)/actions.ts`, `src/app/(home)/layout.tsx` (button wired to the action).
- **Check:** AC-05 (U5, design rule 5).
  • Sign in as `admin@budiman.com`, click Log out → you are at `/login` and the `session` cookie is gone in DevTools.
  • Press the browser Back button or type `/admin` → back at `/login`, no admin page (AC-05).
  • A "Signed out" success message is shown on `/login` (FR-07 confirmation/success style).

## Task 8 – Rate-limit failed logins *(High)*

- **Goal:** More than 5 failed attempts within a minute for the same IP + email gets
  "Too many attempts, try again later" until the minute passes; successful logins are
  not counted.
- **Files:** `src/lib/rateLimit.ts`, `src/app/login/actions.ts` (check before password compare).
- **Check:** AC-07 (U7, design rule 7, OWASP A07).
  • On `/login`, enter wrong credentials for `employee-1@budiman.com` five times — normal "Email or password is wrong" each time.
  • Sixth attempt immediately → "Too many attempts, try again later", even with the **correct** password.
  • Wait about a minute, sign in correctly → it works.
  • Hammer `hr-1@budiman.com` — the limit for `employee-1` is unaffected (per IP + email, interview Q3).

## Task 9 – Whole-module check, lint, README *(Medium)*

- **Goal:** The login module passes every acceptance check end to end, `npm run lint`
  is clean, and the README documents the demo accounts (interview Q7: hints live in docs, not on the login page).
- **Files:** `README.md` (demo accounts section), any file needing small fixes found below.
- **Check:** AC-01…AC-11 in order, then lint.
  • Fresh database: `npx prisma migrate dev` + `npm run db:seed`, start `npm run dev`.
  • Walk the acceptance checklist of `01-requirements.md` §4 top to bottom as written — all eleven rows pass.
  • `npm run lint` → no errors (AGENTS.md: required before every commit).
  • `git status` → no `.env`, `prisma/dev.db`, `.next/` or `node_modules/` staged.
  • README lists the six demo emails and the shared password, and the login page itself shows no hints.

---

**Build order notes.** Tasks 1–2 are the database-first start (schema → seed) that
everything else depends on. 3→4 build the login flow, 5→6 the homes and then the
guards (a guard before the homes would have nothing to guard), 7–8 finish the session
lifecycle and abuse protection, and 9 is the document §8 "Check" step for this module.

---

# Leave Request – Tasks

> **This file answers:** In what order do we build the leave flow, and how do we
> check each step?
> **Who:** The AI drafts it. You review it.
>
> Build one task at a time, in order. When a task is done, the AI changes its
> Status to Done. If something is wrong, fix the spec first, then ask the AI to
> rebuild.
>
> Sources: `01-requirements.md` (leave stories L1–L15 / checks AC-12–AC-27),
> `02-design.md` (leave rules 11–21, screens §5, file map §6), and
> `docs/Agentic AI - HRMS Doc.pdf` (§5, §6 FR-02…FR-08, §7.2). Every task traces
> back to these. Task numbers continue the login table (1–9, all Done).

**Priority.** Do **High** (10–16) first, then **Medium** (17–19). Task 20 is Low
and only built if you ask (FR-09, document §6).

| Status | # | Task | Priority | Checks (from requirements §4) |
|--------|---|------|----------|-------------------------------|
| Done | 10 | LeaveType + LeaveRequest tables; seed the five leave types | High | feeds AC-12…AC-27 (design leave §1) |
| Done | 11 | New leave request — form, validations, submit | High | AC-12, AC-13, AC-14, AC-15 |
| Done | 12 | Employee list + detail + cancel | High | AC-16, AC-21 (employee), AC-22 (submit/cancel), AC-23 |
| Done | 13 | Supervisor list + detail + sign / reject + submitter mode | High | AC-17, AC-18, AC-21 (supervisor), AC-22 (sign/reject), AC-24 (submitter view) |
| Done | 14 | Employee sends the signed request to HR | High | AC-19 |
| Done | 15 | HR queue + approve / reject, officer recorded | High | AC-20, AC-21 (HR), AC-22 (approve/HR-reject) |
| Done | 16 | Authorization hardening — forged actions and URLs | High | AC-24, re-run every tamper note in AC-14/17/20 |
| Done | 17 | Supervisors may apply — verify end to end | Medium | AC-25 |
| Done | 18 | Admin table + status filter, view only | Medium | AC-26 |
| Done | 19 | Whole-module check, lint, README | Medium | AC-12…AC-27 |
| Done | 20 | Employee status filter *(build only if asked)* | Low | AC-27 |

---

## Task 10 – LeaveType + LeaveRequest tables; seed leave types *(High)*

> Database-first, like login Tasks 1→2: the tables exist before any screen can
> read or write a request.

- **Goal:** `LeaveType` and `LeaveRequest` models of design leave §1 exist with
  named relations to `User` (employee, supervisor, hrOfficer) and to `LeaveType`;
  the seed upserts the five Reference C types and stays safe to re-run; no demo
  requests are seeded.
- **Files:** `prisma/schema.prisma`, `prisma/seed.ts`.
- **Check:**
  • Run `npx prisma migrate dev` — it creates the `LeaveType` and `LeaveRequest` tables.
  • In `npx prisma studio` the `LeaveRequest` table shows every field of design §1
    (employeeId, supervisorId, leaveTypeId, otherTypeText, startDate, endDate,
    status, supervisorRemark, hrOfficerId, hrRemark, submittedAt, signedAt,
    sentToHrAt, decidedAt, cancelledAt).
  • The `LeaveType` table holds exactly the five Reference C names; run
    `npm run db:seed` twice — still five, no duplicates.
  • Try inserting a request with a `leaveTypeId` of 999 — the foreign key rejects it.

## Task 11 – New leave request: form, validations, submit *(High)*

- **Goal:** `/employee/leave/new` posts through the two-step confirm (rule 20) to a
  server action that validates rules 11–14 and 21 and creates the row. Covers the
  employee case; supervisors use the same screen (verified in Task 17).
- **Files:** `src/app/(home)/employee/leave/new/page.tsx`, `…/new/actions.ts`,
  `src/lib/leave.ts` (overlap check, supervisor options, submit transition),
  `src/components/leave/confirm-action.tsx`.
- **Check:** AC-12, AC-13, AC-14, AC-15.
  • Sign in as `employee-1@budiman.com` → New leave request → Annual leave,
    2026-12-01→2026-12-05, Supervisor 1 → confirm panel → confirm → success message;
    Prisma Studio shows the row as `PENDING_SUPERVISOR` with `submittedAt` set (AC-12).
  • End before start → "End date cannot be before the start date"; Other with empty
    description → required error; Other + "House move" → submits (AC-13).
  • Dropdown lists only Supervisor 1 and Supervisor 2; a DevTools-tampered value is
    refused by the server; with Employee 1's division set to `Marketing` in Studio,
    the form blocks with an explanation (AC-14).
  • A second request overlapping an active one is refused, naming the conflict (AC-15).

## Task 12 – Employee list, detail, and cancel *(High)*

- **Goal:** `/employee` lists the user's own requests with status badge, type,
  dates, duration and remarks; the detail page shows the date trail and offers
  **Cancel** (confirm panel) only while `PENDING_SUPERVISOR`.
- **Files:** `src/app/(home)/employee/page.tsx`, `…/leave/[id]/page.tsx`,
  `…/leave/[id]/actions.ts`, `src/components/leave/status-badge.tsx`,
  `src/components/leave/request-table.tsx`, `src/lib/leave.ts` (scoped list).
- **Check:** AC-16, AC-21 (employee rows), AC-22 (submit + cancel), AC-23.
  • The 1–5 Dec request reads **5 days**; a same-day one reads **1 day** (AC-16).
  • The list shows only `employee-1`'s own requests, with statuses and remarks (AC-21).
  • Cancel on a Pending-supervisor request → confirm panel → status `CANCELLED`;
    cancelling the panel changes nothing in Studio; a success message shows (AC-22, AC-23).
  • A Signed request's detail shows **no** Cancel button; the same dates can be
    re-submitted after a cancel (AC-23).

## Task 13 – Supervisor list, sign and reject *(High)*

- **Goal:** `/supervisor` shows requests assigned to the logged-in supervisor —
  waiting + past — plus their own submissions; the detail of an assigned request
  offers **Sign** and **Reject** (remark required), each behind a confirm panel,
  and only the assigned supervisor reaches that decision view (rule 19). Own
  submissions open the same page in **submitter mode**: decision fields read-only,
  never Sign/Reject (rule 21), with **Cancel** while `PENDING_SUPERVISOR`
  (reusing the employee action) — **Send to HR** joins it in Task 14. This is
  what lets interview Q4 (L13) finish without new code in Task 17.
- **Files:** `src/app/(home)/supervisor/page.tsx`,
  `…/supervisor/leave/[id]/page.tsx`, `…/leave/[id]/actions.ts`,
  `src/components/leave/remark-field.tsx`, `src/lib/leave.ts`.
- **Check:** AC-17, AC-18, AC-21 (supervisor rows), AC-22 (sign/reject).
  • `supervisor-1` sees the waiting request, signs it after the confirm panel →
    status `SIGNED`, `signedAt` set (AC-17).
  • `supervisor-2` never sees it; opening its detail URL as `supervisor-2` bounces
    like a nonexistent id (AC-17).
  • Reject with empty remark → "Remark is required"; with a remark → 
    `REJECTED_SUPERVISOR` and the employee can read it; afterwards no action
    button appears for anyone (AC-18).
  • `supervisor-1` opens their **own** submission from the `/supervisor` list:
    decision fields are read-only, no Sign/Reject appears (rule 21), and Cancel
    is offered while Pending supervisor (AC-24).

## Task 14 – Employee sends the signed request to HR *(High)*

- **Goal:** on the employee's detail page, **Send to HR** appears only when the
  request is `SIGNED`; the confirmed action sets `PENDING_HR` + `sentToHrAt` and
  the request appears in the HR queue (page arrives in Task 15 — verify via
  Studio now, and in Task 15 from the UI). The same button joins the supervisor
  page's **submitter mode** (L13, interview Q4).
- **Files:** `src/app/(home)/employee/leave/[id]/page.tsx`, `…/[id]/actions.ts`,
  and `src/app/(home)/supervisor/leave/[id]/page.tsx` (button wired into the
  submitter view, reusing the same server action).
- **Check:** AC-19 (first half).
  • As `employee-1`, the Signed request offers Send to HR → confirm → status
    `PENDING_HR`, `sentToHrAt` set, success message.
  • A `PENDING_SUPERVISOR` or `SIGNED`-again tampered POST changes nothing; no
    Send-to-HR button shows before the Signed state.
  • `supervisor-1`'s own Signed request, opened from `/supervisor`, also offers
    **Send to HR** → confirm → `PENDING_HR` + `sentToHrAt` (AC-24, L13).

## Task 15 – HR queue, approve and reject *(High)*

- **Goal:** `/hr` lists the whole `PENDING_HR` queue (any division) plus past
  decisions; the queue detail offers **Approve** / **Reject** (remark required)
  behind confirm panels; the deciding officer and `decidedAt` are stamped once
  (rule 17) and no action remains on Final rows (rule 18).
- **Files:** `src/app/(home)/hr/page.tsx`, `src/app/(home)/hr/leave/[id]/page.tsx`,
  `…/hr/leave/[id]/actions.ts`.
- **Check:** AC-19 (UI half), AC-20, AC-21 (HR rows), AC-22 (approve/HR-reject).
  • The request sent in Task 14 now appears for both `hr-1` and `hr-2` (AC-19, AC-21).
  • `hr-1` approves after the confirm panel → `APPROVED`, detail shows officer
    **HR 1** + decision date (AC-20).
  • On another item `hr-2` must enter a remark to reject → `REJECTED_HR`, officer
    **HR 2** (AC-20).
  • Decided requests show no buttons in `/hr`, `/employee`, `/supervisor` (AC-20).

## Task 16 – Authorization hardening: forged actions and URLs *(High)*

> The login module had a dedicated guard task (Task 6); this is the same idea for
> the leave actions — build-time checks are not enough, so probe them.

- **Goal:** prove rules 15, 18, 19 and 21 hold against a hostile browser: the only
  trusted input is the request `id`; everything else is re-derived server-side.
- **Files:** wherever a probe finds a hole (expect `…/[id]/actions.ts` files and
  `src/lib/leave.ts`).
- **Check:** AC-24, plus re-run each tamper note:
  • AC-24: `supervisor-1`'s dropdown excludes themselves; a DevTools-tampered
    self-supervisor submission is refused; their own signed request offers them no
    sign button.
  • Edit a confirm form in DevTools to target **another user's request id** → refused.
  • Post a reject action to a request that is already `SIGNED` (wrong current
    status) → refused; post any action to a Final request → refused (rule 18).
  • As `hr-1`, open an `employee`'s detail URL, and as `employee-1` an `hr` detail
    URL → bounce like a nonexistent id (rule 19).
  • Disable JavaScript and repeat sign + approve → the server-side confirm panel
    still gates the action (rule 20).

## Task 17 – Supervisors may apply — end to end *(Medium)*

- **Goal:** verify interview Q4 works through the whole chain using the same
  screens (no new code expected; fix what the walk breaks).
- **Files:** none expected; fixes where the walk fails.
- **Check:** AC-25.
  • `supervisor-1` submits Unpaid leave 2027-01-04→2027-01-08 choosing Supervisor 2.
  • `supervisor-2` signs → `supervisor-1` sends to HR → `hr-1` approves; each
    person's list shows the matching status at every step.
  • HR and Admin accounts show no **New leave request** anywhere (rule 14).

## Task 18 – Admin table with status filter, view only *(Medium)*

- **Goal:** `/admin` renders every request — employee, supervisor, type, dates,
  status — newest `submittedAt` first, with a status dropdown filter via `?status=`;
  zero mutating controls (FR-08, L14).
- **Files:** `src/app/(home)/admin/page.tsx` (reuses `request-table.tsx`).
- **Check:** AC-26, AC-21 (admin row).
  • As `admin@budiman.com` the table lists every request from all the checks above,
    newest submitted first, including requests supervisors submitted themselves.
  • Picking `Approved` in the filter shows exactly the approved rows (and the URL
    carries `?status=APPROVED`, so it can be bookmarked).
  • Tab through the whole page: no button or link changes data.

## Task 19 – Whole-module check, lint, README *(Medium)*

- **Goal:** the leave module passes its acceptance list end to end on a fresh
  database; lint is clean; the README explains the flow and demo walk.
- **Files:** `README.md` (leave section), any file needing small fixes found below.
- **Check:** AC-12…AC-27 in order, then lint.
  • Fresh start: delete `prisma/dev.db`, `npx prisma migrate dev`, `npm run db:seed`,
    `npm run dev`.
  • Walk the leave acceptance checklist of `01-requirements.md` §4 top to bottom —
    every row passes (AC-27 excepted — it belongs to the Low task 20).
  • `npm run lint` → no errors (AGENTS.md: before every commit).
  • `git status` → still no `.env`, `prisma/dev.db`, `.next/` or `node_modules/`.
  • README gains a short "Leave flow" section: the walk employee-1 → supervisor-1
    → employee-1 → hr-1, using the demo accounts.

## Task 20 – Employee status filter *(Low — build only if asked)*

- **Goal:** the employee's own list gains a status dropdown (`?status=`), same
  pattern as the admin filter (L15, FR-09).
- **Files:** `src/app/(home)/employee/page.tsx`.
- **Check:** AC-27.
  • As `employee-1`, filter by `Signed` → only signed rows remain; clearing the
    filter shows all again.

---

**Build order notes (leave).** Task 10 is the database-first start like login
1→2. 11→12 build the submitter's side (a list before there is anything to list
would be untestable), 13 the deciding supervisor, 14 the employee's send step
(the bridge into the queue), 15 the HR queue that receives it, 16 the guard-style
hardening once every action exists to be forged — mirroring login Task 6. 17–18
are the Medium items (FR-08 and interview Q4), 19 is the document §8 "Check"
step for this module, and 20 is the only Low, kept last per FR-09.
