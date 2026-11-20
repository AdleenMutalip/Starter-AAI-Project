# Login – Design

> **This file answers:** How is the app put together? (data, rules, screens,
> where the code lives)
> **Who:** The AI drafts it. You review all of it.
>
> If this file and the requirements disagree, fix the requirements first,
> then this file.
>
> Companion: `01-requirements.md` (login stories U1–U11, checks AC-01–AC-11).
> This file covers **login only**; the leave tables, screens and rules join here
> when their requirements are added.

## 1. Tables

### `User` – one row per person who can log in

Every login user; matches document §7.2. Leave-request tables will reference this
table later but are out of scope here.

| Field | Type | Required? | What it holds |
|-------|------|-----------|---------------|
| `id` | number | auto | Unique number for the row |
| `name` | text | yes | Full name, e.g. `Supervisor 1` |
| `icNumber` | text | yes, unique | Identity card no., format `xx-xxxxxx` (two digits, hyphen, six digits), e.g. `00-148888` |
| `email` | text | yes, unique | Work email, always `@budiman.com`, lowercase. **The login identifier** |
| `passwordHash` | text | yes | bcrypt hash of the password. Never the plain password, never shown in any screen or log |
| `role` | text | yes | One of `EMPLOYEE`, `SUPERVISOR`, `HR`, `ADMIN` — exactly one role per user |
| `division` | text | yes | The user's division (Reference A). Used later to pick a supervisor |
| `designation` | text | yes | Job title (Reference A) |
| `createdAt` | date | auto | Set by the seed/insert, never by the user |

Store: one SQLite file via Prisma (`prisma/dev.db`, git-ignored). The session itself
is **not** stored in the database — it lives only in the signed cookie (rule 4).

## 2. Business rules

1. **One identity.** Login is by `email` + password only. Emails are unique and must
   end with `@budiman.com` before anything is looked up (U9).
2. **Passwords are only ever bcrypt hashes.** Written by the seed as
   `bcrypt(password123)`; compared with `bcrypt.compare`. No screen, log line or error
   ever repeats a password or which field was wrong (U2, document §7.1).
3. **One message for bad logins.** Any unknown email, wrong password, or malformed
   email shows the same failure to the user ("Email or password is wrong"), except the
   form-level `@budiman.com` format check which is client guidance (U2, U9).
4. **Session = signed cookie.** After a good login the server sets one cookie,
   `session`, containing `{ userId, role, expiresAt }`, signed with HMAC-SHA256
   (Node's built-in `node:crypto`, secret in `SESSION_SECRET`). Tampered or expired
   cookies are treated as "not logged in". No new packages.
5. **Remember me.** Ticked → cookie expiry 30 days. Unticked → session cookie (gone
   when the browser closes). Logout deletes the cookie. No server-side revocation
   (U5, U8 — interview Q2).
6. **Every page checks the session on the server.** A page renders only if the cookie
   verifies and `role` matches the page. Not logged in → `/login`. Logged in with the
   wrong role → the user's own home page, silently. Logged in and opening `/login` →
   own home page (U3, U4, U10 — interview Q4/Q5).
7. **Rate limit before the password check.** At most 5 login attempts per minute per
   IP address + email, counted in an in-memory map. Over the limit → "Too many
   attempts, try again later" (U7 — interview Q3, OWASP A07).
8. **Roles are fixed.** Roles are only the four values above; there is no sign-up and
   no role change in the app (requirements §5).
9. **Demo accounts are the only accounts.** The six users of Reference B are the seed;
   everyone logs in with `password123`, stored hashed (U6).
10. **Leave pages don't exist yet.** Until FR-02+ are specified, the role home pages
    show only the role name and a Log out button.

## 3. Technology

The stack is fixed by document §7.1 and `package.json`; nothing new is added.

| Part | Choice | In plain words |
|------|--------|----------------|
| Web framework | Next.js 16 (App Router) + TypeScript | Screens and server logic in one project |
| Login mechanics | Server actions on the login form | No separate API to design |
| Passwords | `bcryptjs` (pinned 3.0.3) | One-way hash + slow compare |
| Session | Signed cookie, `node:crypto` HMAC | Simple and safe, no extra accounts or packages |
| Database | SQLite + Prisma 6.19 | One file, no database server |
| Styling | Tailwind CSS 4 | Styles sit next to each screen |
| Seed script | `tsx` (already a devDependency) | Runs the TypeScript seed that loads Reference B |

## 4. Screens (routes)

One row per screen. "Who" is enforced on the server per rule 6, not just by hiding links.

| Route | Who | What it shows | Status |
|-------|-----|---------------|--------|
| `/login` | Visitor only | Email field, password field, "Remember me" tick, Sign in button. Errors per rules 3 and 7. A logged-in user is redirected to their home (U10) | To do |
| `/` | Anyone | Redirects: logged in → own role home; not logged in → `/login`. No content of its own | To do |
| `/employee` | Employee | Employee home: heading + Log out button (placeholder until leave stories) | To do |
| `/supervisor` | Supervisor | Supervisor home: heading + Log out button (placeholder) | To do |
| `/hr` | HR | HR home: heading + Log out button (placeholder) | To do |
| `/admin` | Admin | Admin home: heading + Log out button (placeholder) | To do |

Each home page has a **Log out** button (server action, rule 5). Buttons and forms are
server actions throughout — no hand-written API routes (document §7.1).

### Visual theme (login + home screens)

Agreed 2026-11-20 from the mock in `login-design.png` (repo root). **Look only** —
no screen, route or behaviour changes.

- **Page background:** full-viewport vertical gradient from the mock's sky, no
  illustration (gradient-only decision): `#86C7F2 → #5D93E8 → #6C5DD3 → #432E9E`
  (top to bottom).
- **Card:** one centred "glass" card per screen — translucent indigo
  `rgba(129,140,248,0.25)` over the gradient, `backdrop-blur`, rounded 24px,
  1px border `rgba(255,255,255,0.25)`, soft shadow, inner padding 32px, width 384px
  (login) / 672px (home, header + content inside one card).
- **Login card:** title **"Login"** centred, white, bold, 30px. Fields are
  **pills**: fully rounded, translucent white `rgba(255,255,255,0.25)`, white text,
  placeholder `rgba(255,255,255,0.7)`, a white inline person icon (email) and lock
  icon (password) inside the left of each field. Field labels move to placeholders +
  `aria-label` (names stay "Work email" / "Password" so the hand checks still work).
  "Remember me" checkbox + label in white sit below the fields on the left.
  **No "Forgot Password" and no "Register" links** (requirements §5 keeps them out).
- **Buttons:** bright sky-blue pill `#2CABE7` (hover `#1B95D3`), white bold text —
  Sign in (login card) and Log out (home header, right side).
- **Home card:** header row with brand "Budiman HRMS" (white, bold, 18px, left) and
  the Log out pill (right); content below: page title white 24px, body text
  `rgba(255,255,255,0.85)`.
- **Messages** (behaviour unchanged): errors render as a rounded panel
  `rgba(225,29,72,0.75)` white text inside the card; the "Signed out." success
  message as `rgba(16,185,129,0.75)` white text.
- **Spacing:** field vertical rhythm 16px; 24px between fields and the button row;
  elements full width of the card.

## 5. Where the code lives

| Folder / file | What's in it |
|---------------|--------------|
| `prisma/schema.prisma` | The `User` model (section 1), SQLite datasource |
| `prisma/seed.ts` | Creates the six Reference B users with `bcrypt.hashSync('password123')` hashes; safe to re-run |
| `src/lib/auth.ts` | Cookie sign/verify (HMAC), `createSession()`, `destroySession()`, `getCurrentUser()` — the only code that reads the session |
| `src/lib/passwords.ts` | `hashPassword()` / `verifyPassword()` wrappers around bcryptjs |
| `src/lib/rateLimit.ts` | In-memory attempt counter for rule 7 |
| `src/app/login/page.tsx` | The login form (client form posting to the server action) |
| `src/app/login/actions.ts` | `signIn` server action: rate limit → format check → bcrypt compare → set cookie → redirect to role home |
| `src/app/(home)/employee/page.tsx` | Employee home |
| `src/app/(home)/supervisor/page.tsx` | Supervisor home |
| `src/app/(home)/hr/page.tsx` | HR home |
| `src/app/(home)/admin/page.tsx` | Admin home |
| `src/app/(home)/layout.tsx` | Calls `getCurrentUser()`; enforces rules 6 before any home page renders; holds the shared header with Log out |
| `src/app/(home)/actions.ts` | `signOut` server action (deletes cookie, redirects to `/login`) |
| `src/app/page.tsx` | Root redirect only |
| `package.json` | Add `db:seed` (`tsx prisma/seed.ts`) and `db:migrate` scripts |
| `.env` / `.env.example` | `DATABASE_URL`, `SESSION_SECRET` (`.env` is git-ignored; `.env.example` has placeholders, never a real secret) |

*(Route groups `login/` and `(home)/` follow App Router conventions; exact folder names
may shift during the build, routes above stay as specified. Per AGENTS.md, the Next 16
docs under `node_modules/next/dist/docs/` are read before any code is written.)*

## 6. Security (in plain words)

- **Every page checks the cookie on the server** before rendering — hiding links or
  buttons is never the protection (rule 6). Server actions re-check the same way, so a
  forged POST cannot skip the page check either.
- **The session cookie is signed (HMAC-SHA256)** with a secret kept in `.env`;
  it carries only `userId`, `role`, `expiry` — no password data. Flags: `httpOnly`,
  `sameSite=lax`, `path=/`, `secure` in production.
- **Passwords** exist only as bcrypt hashes (cost 10); compared with bcrypt; never
  logged, never in error messages, never sent to the browser (rules 2–3).
- **Email is validated** (`@budiman.com`, length limits) before it is used in any
  query; Prisma parameterised queries mean no string SQL, so no injection (OWASP A03).
- **Rate limiting** throttles credential guessing per IP + email (rule 7, OWASP A07).
- **No enumeration:** same error text and comparable timing for unknown email vs wrong
  password; no hint of valid accounts anywhere on the page (U2, U11-adjacent interview Q7).
- **Authorization is role-per-page:** the route a page lives under and the `role` in the
  verified cookie must match, or the visitor is redirected (rule 6, FR-01).
- `.env`, `prisma/dev.db` and `.next/` stay out of git.

## 7. Commands

| Command | What it does |
|---------|--------------|
| `npm install` | Install the pinned packages |
| `npx prisma migrate dev` | Create/update the SQLite database from `schema.prisma` |
| `npm run db:seed` | Load the six demo users (Reference B) with hashed passwords |
| `npm run dev` | Start the app at http://localhost:3000 |
| `npm run lint` | Check the code style — before every commit (AGENTS.md) |

---

# Reference

## Reference A. Fixed choices

- **Roles:** `EMPLOYEE`, `SUPERVISOR`, `HR`, `ADMIN` (one per user)
- **Divisions → designations** (document §7.2):
  - **Finance:** Finance Manager, Accountant, Accounts Clerk
  - **Human Resources:** HR Manager, HR Officer, HR Assistant
  - **Information Technology:** IT Manager, Software Developer, IT Support Officer
  - **Operations:** Operations Manager, Operations Supervisor, Operations Executive
  - **Marketing:** Marketing Manager, Marketing Executive, Marketing Assistant
  - **Admin** (demo admin only, no designations list in the document): Admin Manager

## Reference B. Demo data (document §7.2)

| Email | Name | IC No. | Role | Division | Designation |
|-------|------|--------|------|----------|-------------|
| `employee-1@budiman.com` | Employee 1 | 00-148888 | Employee | Finance | Accounts Clerk |
| `supervisor-1@budiman.com` | Supervisor 1 | 00-157777 | Supervisor | Finance | Finance Manager |
| `supervisor-2@budiman.com` | Supervisor 2 | 00-166666 | Supervisor | Finance | Accountant |
| `hr-1@budiman.com` | HR 1 | 00-175555 | HR | Human Resources | HR Officer |
| `hr-2@budiman.com` | HR 2 | 00-184444 | HR | Human Resources | HR Officer |
| `admin@budiman.com` | Admin | 00-193333 | Admin | Admin | Admin Manager |

All six log in with password `password123`, seeded as a bcrypt hash — never plain text.

## Reference C. Leave types (document §7.2)

| Name | Notes (document) |
|------|------------------|
| Annual leave | Yearly paid leave |
| Maternity leave | For employees who are expecting or have just given birth |
| Unpaid leave | Leave without pay |
| Compassionate leave | For a family emergency or bereavement |
| Other | The employee must write what it is for (`otherTypeText` becomes required) |

---

# Leave Request – Design

> **This file answers:** How is the leave module put together? (data, rules,
> screens, where the code lives)
> **Who:** The AI drafts it. You review all of it.
>
> If this file and the requirements disagree, fix the requirements first,
> then this file.
>
> Companion: `01-requirements.md` (leave stories L1–L15, checks AC-12–AC-27).
> The login sections above stay valid and untouched; login business rules 1–10
> still apply to everything here. Leave rules are numbered **11–21** so they
> continue the list. Login rule 10 ("Leave pages don't exist yet") is superseded
> as the leave tasks (03-tasks #10–20) complete — it is kept above as history.

## 1. New tables

### `LeaveType` – the fixed choices on the leave form

One row per type; names are the five in **Reference C**. The seed upserts them by
name (safe to re-run). There is no screen to change them (not in FR-02…FR-08).

| Field | Type | Required? | What it holds |
|-------|------|-----------|---------------|
| `id` | number | auto | Unique number for the row |
| `name` | text | yes, unique | One of the five Reference C names |

### `LeaveRequest` – one row per request

Matches the document §7.2 "Leave requests" minimum, plus `sentToHrAt` and
`cancelledAt` which this spec adds so the audit trail covers the employee's two
steps (sending and cancelling). All dates are real dates, never free text.

| Field | Type | Required? | What it holds |
|-------|------|-----------|---------------|
| `id` | number | auto | Unique number for the row |
| `employeeId` | number | yes | → `User.id` of the submitter (Employee or Supervisor, rule 14). Links to Users, as document §7.2 says |
| `supervisorId` | number | yes | → `User.id` of the assigned supervisor — same division as the submitter, never the submitter (rules 13, 21). Links to Users |
| `leaveTypeId` | number | yes | → `LeaveType.id`. Links to Leave types |
| `otherTypeText` | text | only when type is Other, then required | What the leave is for, ≤ 500 chars |
| `startDate` | date | yes | First day of leave |
| `endDate` | date | yes | Last day of leave; never before `startDate` (rule 11) |
| `status` | text | yes | One of the seven codes in §2 (rule 15) |
| `supervisorRemark` | text | required when the supervisor rejects | The supervisor's reason, ≤ 500 chars (rule 16) |
| `hrOfficerId` | number | set by the first HR decision | → `User.id` of the HR user who decided; immutable after (rule 17) |
| `hrRemark` | text | required when HR rejects | HR's reason, ≤ 500 chars (rule 16) |
| `submittedAt` | date | auto | Set when submitted |
| `signedAt` | date | auto | Set when the supervisor signs |
| `sentToHrAt` | date | auto | Set when the employee sends it to HR (spec addition) |
| `decidedAt` | date | auto | Set when HR approves or rejects |
| `cancelledAt` | date | auto | Set when the employee cancels (spec addition) |

Relations to `User` are named (`employee`, `supervisor`, `hrOfficer`) so each
request has exactly one of each. SQLite stores the status as text; only the seven
codes below ever appear.

## 2. Status codes (document §5.2 + Cancelled)

| Stored code | Shown as | Set by |
|-------------|----------|--------|
| `PENDING_SUPERVISOR` | Pending supervisor | submit |
| `SIGNED` | Signed | assigned supervisor |
| `PENDING_HR` | Pending HR | the submitter, after Signed (L7) |
| `APPROVED` | Approved | any HR officer |
| `REJECTED_SUPERVISOR` | Rejected by supervisor | assigned supervisor |
| `REJECTED_HR` | Rejected by HR | any HR officer |
| `CANCELLED` | Cancelled | the submitter, before signing |

## 3. Business rules (continue the login list)

11. **Count leave in calendar days.** `startDate`/`endDate` must be real dates with
    `endDate` **not before** `startDate`; same-day leave is allowed and is 1 day.
    The shown duration is `endDate − startDate + 1` calendar days; weekends and
    holidays count normally (L4 — interview Q1).
12. **One active request per day.** A submission is refused when its date range
    overlaps one of the submitter's **own** requests whose status is not
    `REJECTED_SUPERVISOR`, `REJECTED_HR` or `CANCELLED`. The overlap check runs on
    the server at submit time (L3 — interview Q2).
13. **The supervisor comes from your division.** The picker lists only `SUPERVISOR`
    users in the submitter's own division, excluding the submitter. An empty list
    blocks submission with an explanatory message (L2 — §5.3 rule 3, interview Q6).
14. **Who may submit.** Roles `EMPLOYEE` and `SUPERVISOR` only; `HR` and `ADMIN`
    never create requests (L13 — interview Q4).
15. **Status moves only along the state machine.** Any other move — wrong actor,
    wrong current status, forged form field — is refused by the server:

    | From | Actor (checked on server) | Action | To | Writes |
    |------|---------------------------|--------|----|--------|
    | — | submitter (EMPLOYEE/SUPERVISOR) | Submit | `PENDING_SUPERVISOR` | `submittedAt` |
    | `PENDING_SUPERVISOR` | assigned supervisor | Sign | `SIGNED` | `signedAt` |
    | `PENDING_SUPERVISOR` | assigned supervisor | Reject + remark | `REJECTED_SUPERVISOR` | `supervisorRemark` |
    | `PENDING_SUPERVISOR` | submitter only | Cancel | `CANCELLED` | `cancelledAt` |
    | `SIGNED` | submitter only | Send to HR | `PENDING_HR` | `sentToHrAt` |
    | `PENDING_HR` | any HR user, never the submitter (rule 21) | Approve | `APPROVED` | `hrOfficerId`, `decidedAt` |
    | `PENDING_HR` | any HR user, never the submitter (rule 21) | Reject + remark | `REJECTED_HR` | `hrOfficerId`, `hrRemark`, `decidedAt` |

16. **Remarks when rejecting.** A supervisor or HR rejection needs a trimmed,
    non-empty remark (1–500 chars), stored with the request. Remarks are never
    edited afterwards (L6, L8 — FR-03/FR-05).
17. **The deciding officer is recorded.** The first Approve/Reject in the queue
    stamps `hrOfficerId` with the logged-in HR user and sets `decidedAt`; both are
    immutable after that, whoever looks afterwards (L8 — FR-05).
18. **Final is final.** `APPROVED`, `REJECTED_SUPERVISOR`, `REJECTED_HR` and
    `CANCELLED` are read-only for every role: no button renders and the server
    refuses every action on them (L11, document §5.2).
19. **Server-side scoping.** Every list and detail query filters by the session
    user's role **and** identity: submitter → own requests; supervisor → requests
    assigned to them; HR → the queue and all decisions; admin → everything,
    read-only. A page never receives all rows and hides some (L9, L14 — the
    login rule 6 applied to data, OWASP A01).
20. **Confirm then act, success after.** Every mutating button posts twice: the
    first POST re-renders the page with a server-side confirm/cancel panel
    (summarising request + action); only the confirm POST changes data, and then a
    success banner is shown. Works with JavaScript disabled — one shared
    component, one pattern (L10 — FR-07, interview Q8).
21. **No self-decisions.** A user never acts on their own request: at submit
    `supervisorId ≠ employeeId` (L12); at sign/decide the acting user must not be
    `employeeId` (interview Q4).

## 4. Who can do what

| Action | Employee | Supervisor | HR | Admin |
|--------|----------|------------|----|-------|
| Submit a request | own | own | — never (rule 14) | — never |
| See requests | their own | assigned to them **+** their own submissions | the whole Pending-HR queue + past decisions | every request, read-only |
| Sign / reject as supervisor | — | assigned only, never their own | — | — |
| Cancel | their own, while `PENDING_SUPERVISOR` | their own, while `PENDING_SUPERVISOR` | — | — |
| Send to HR | their own, while `SIGNED` | their own, while `SIGNED` | — | — |
| Approve / reject in queue | — | — | any queue item, never their own | — |
| Anything else | — | — | — | nothing — view only (FR-08) |

## 5. Screens (routes)

All routes sit under `(home)/`, so the login guard (rule 6) covers them; each
detail page **also** checks scope per rule 19 (an out-of-scope id behaves exactly
like a request that does not exist — no leak of its existence).

| Route | Who | What it shows | Status |
|-------|-----|---------------|--------|
| `/employee` | Employee | My requests: status badge, type, dates, duration, remarks when set; **New leave request** button; status filter (L15) | To do |
| `/employee/leave/new` | Employee or Supervisor (own submissions — matrix, Task 11) | The form: leave type (Reference C), Other-description field (required when Other), start & end dates, supervisor dropdown (rule 13) or the "no supervisor in division" block; confirm panel on submit | To do |
| `/employee/leave/[id]` | Employee (own only) | One request: all fields, dates trail, remarks; actions **Send to HR** (when `SIGNED`) and **Cancel** (when `PENDING_SUPERVISOR`), each behind a confirm panel | To do |
| `/supervisor` | Supervisor | "Waiting for me" (`PENDING_SUPERVISOR` assigned to me) + my past ones + my own submissions with their status; **New leave request** button → `/employee/leave/new` (supervisors apply on the same form, L13) | To do |
| `/supervisor/leave/[id]` | Supervisor — request assigned to them, **or** submitted by them | Assigned: full detail + **Sign** / **Reject** (remark field required on reject) behind confirm panels. Own submission: same page in **submitter mode** — decision fields read-only, no Sign/Reject ever (rule 21) — with the submitter's **Cancel** (while `PENDING_SUPERVISOR`) and **Send to HR** (when `SIGNED`), the same actions as `/employee/leave/[id]` (L13) | To do |
| `/hr` | HR | The queue (`PENDING_HR`, any division) + past decisions | To do |
| `/hr/leave/[id]` | HR | One queue request + **Approve** / **Reject** (remark required) behind confirm panels; decided items show officer + dates, no actions | To do |
| `/admin` | Admin | One table of every request — employee, supervisor, type, dates, status — newest `submittedAt` first, status dropdown filter (reads `?status=` from the URL); no actions (FR-08) | To do |

The four home pages keep the Log out button from the login design; the leave
content replaces the "placeholder" note in the login §4 screen table.

### Visual theme (leave screens)

Same glass theme as login: translucent panels on the sky gradient, `#2CABE7` pill
buttons. Additions only:

- **Status badge** per status: amber (Pending supervisor), sky (Signed), indigo
  (Pending HR), green (Approved), red (Rejected by supervisor / by HR), grey
  (Cancelled) — always text + colour, never colour alone.
- **Lists** are one translucent row per request inside the page card; click a row
  to open its detail.
- **Confirm panel** replaces the action row in place: one sentence naming what
  will happen ("Sign this request from Employee 1, 1–5 Dec, Annual leave?") plus
  Confirm / Cancel pills.
- **Success banner** reuses the login's green `rgba(16,185,129,0.75)`; errors the
  red `rgba(225,29,72,0.75)` panel.

## 6. Where the leave code lives

| Folder / file | What's in it |
|---------------|--------------|
| `prisma/schema.prisma` | Add `LeaveType` and `LeaveRequest` models (§1) with the named relations |
| `prisma/seed.ts` | Also upsert the five Reference C leave types (still no demo requests) |
| `src/lib/leave.ts` | Shared queries: scoped lists per role (rule 19), overlap check (rule 12), supervisor options for the dropdown (rule 13), and the one function that validates + applies a transition (rule 15) |
| `src/components/leave/status-badge.tsx` | The badge per the theme above |
| `src/components/leave/request-table.tsx` | The shared list/table of requests (employee, supervisor, HR, admin variants) |
| `src/components/leave/confirm-action.tsx` | The two-step confirm/cancel form (rule 20) used by every action |
| `src/components/leave/remark-field.tsx` | Remark textarea with the 500-char limit (rule 16) |
| `src/app/(home)/employee/page.tsx` | Employee list + status filter (`?status=`) |
| `src/app/(home)/employee/leave/new/page.tsx` + `actions.ts` | The form; `submitLeaveRequest` (validates rules 11–14, 21) and `confirmSubmitLeaveRequest` |
| `src/app/(home)/employee/leave/[id]/page.tsx` + `actions.ts` | Own detail; `cancelLeaveRequest` + `confirmCancelLeaveRequest`, `sendToHr` + `confirmSendToHr` |
| `src/app/(home)/supervisor/page.tsx` | Supervisor list (waiting + past + own) |
| `src/app/(home)/supervisor/leave/[id]/page.tsx` + `actions.ts` | Assigned detail; `signLeaveRequest` / `rejectLeaveRequest` + their confirm steps. Own submissions open here too, in submitter mode — Cancel / Send-to-HR reuse the functions in `…/employee/leave/[id]/actions.ts` (L13, rule 21) |
| `src/app/(home)/hr/page.tsx` | HR queue + history |
| `src/app/(home)/hr/leave/[id]/page.tsx` + `actions.ts` | Queue detail; `approveLeaveRequest` / `rejectAsHrLeaveRequest` + their confirm steps |
| `src/app/(home)/admin/page.tsx` | The read-only table; reads `?status=` in a server component |

Every action above is a server action (document §7.1) that re-checks: session →
role → ownership/assignment → current status → validation → write (rules 15, 19,
21). In action forms the request `id` is the only value that decides *which row*
is touched — status, dates, supervisor and officer are never taken from the form,
and the row is reloaded from the database before any decision. Typed input (a
rejection remark) is only ever validated and stored (rule 16); it never steers the
transition.

## 7. Security notes specific to leave (FR-10)

- **Broken access control (A01) is the big risk here**: every mutation and detail
  page re-derives who may act from the session + the database row, never from
  hidden form fields; out-of-scope detail ids 404-like redirect to the role's own
  home, identical to a nonexistent id.
- **Forged transitions (A01/A04)**: the transition function (rule 15) is the only
  writer of `status`; it refuses anything not in the table, including on Final rows.
- **Injection / XSS (A03/A05)**: remarks and `otherTypeText` go through Prisma
  parameterised queries only and render as React text; both trimmed and capped at
  500 chars server-side, not just in the form.
- **Validation (A05)**: dates parsed as real dates; the overlap check runs again at
  the confirm step, so two fast submissions on the same day cannot both slip in.
- **Data exposure**: lists and details are scoped in the query (rule 19); the
  admin table shows all because the admin role is allowed all (FR-08) — no other
  role can reach another's data through a URL, filter or tampered form.
- `.env`, `prisma/dev.db` and `.next/` stay out of git (unchanged).

## 8. Commands

No new commands: `npx prisma migrate dev` picks up the two new models, and
`npm run db:seed` (Task 10) now loads users **and** the five leave types. The
login §7 command table remains accurate.
