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
| To do | 1 | Database and Users table | High | feeds AC-06 (design §1, §7) |
| To do | 2 | Seed the six demo users | High | AC-06 |
| To do | 3 | Login page (form only) | High | AC-11 (U11, design §4) |
| To do | 4 | Sign-in: bcrypt check + session cookie | High | AC-02, AC-08, AC-09 |
| To do | 5 | Role home pages + root redirect | High | AC-01 |
| To do | 6 | Server-side access control | High | AC-03, AC-04, AC-10 |
| To do | 7 | Logout | High | AC-05 |
| To do | 8 | Rate-limit failed logins | High | AC-07 |
| To do | 9 | Whole-module check, lint, README | Medium | all AC-01…AC-11 |

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
