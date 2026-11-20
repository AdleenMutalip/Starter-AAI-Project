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
