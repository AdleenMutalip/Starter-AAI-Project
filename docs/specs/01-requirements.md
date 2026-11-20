# Login – Requirements

> **This file answers:** What should the app do, and why?
> **Who:** The AI drafts it from your interview. You review it.
>
> When the app's behaviour needs to change, update this file **first**.
>
> Source of truth: `docs/Agentic AI - HRMS Doc.pdf` (FR-01, FR-10, §7.2, §7.5) and the
> login interview of 2026-11-20. This file covers **login only**; the leave-request
> stories will be added here later, before the rest of the system is built.

## 1. The problem

Budiman Company's paper leave process has no system at all today: there is nothing to
log in to, and anyone could open the future leave screens on a shared laptop. Before
anyone can submit or decide a leave request, the system must know **who** is using it
and **which role** they have, because each role sees only the pages it is allowed to.

This module provides:

1. Login with the user's `@budiman.com` email and password (passwords stored hashed with bcryptjs, never plain text).
2. A signed session cookie that remembers who is logged in, with an optional "Remember me" for 30 days.
3. A per-role home page, and blocking of any page that does not belong to the logged-in user's role.
4. Logout, and protection of every page for visitors who are not logged in.
5. The six demo accounts from document §7.2, seeded with the hashed password `password123`.

## 2. Who uses it (roles)

| Role | Home page | What they do |
|------|-----------|--------------|
| **Visitor (not logged in)** | `/login` | Enters email and password. Cannot open any other page. |
| **Employee** | `/employee` | Logs in and lands on their home page. Logs out. |
| **Supervisor** | `/supervisor` | Logs in and lands on their home page. Logs out. |
| **HR** | `/hr` | Logs in and lands on their home page. Logs out. |
| **Admin** | `/admin` | Logs in and lands on their home page. Logs out. |

One user has exactly one role (document §7.2); a role never opens another role's pages (FR-01).
Home-page routes are confirmed here and used again in `02-design.md`.

## 3. User stories

- **U1. Log in** *(High)*. As an Employee, Supervisor, HR officer, or Admin, I can log in with my `@budiman.com` email and my password so that the system knows who I am and opens my home page.
- **U2. Reject bad credentials** *(High)*. As a user, I get one single error message when my email or password is wrong, so that nobody can find out which emails have accounts.
- **U3. Keep strangers out** *(High)*. As the company, we send any visitor who is not logged in to `/login`, so that no page can be used without an identity.
- **U4. Block the wrong role** *(High)*. As the company, we redirect a logged-in user who opens another role's page back to their own home page, so that each person sees only the pages their role may open (FR-01).
- **U5. Log out** *(High)*. As any user, I can log out so that the next person at this laptop is not signed in as me.
- **U6. Demo accounts seeded** *(High)*. As a developer or reviewer, the six demo users from document §7.2 exist in the database with the hashed password `password123`, so that every check below can be repeated by anyone.
- **U7. Rate-limit guessing** *(High)*. As the company, we allow at most 5 login attempts per minute per IP address and email, so that password guessing is slowed down (OWASP A07, document §7.5).
- **U8. Remember me** *(Medium)*. As a user on my own laptop, I can tick "Remember me" so that I stay logged in for 30 days; without the tick, my session ends when I close the browser.
- **U9. Check the email format** *(Medium)*. As a user, I am told immediately when my email is not a valid `@budiman.com` address, so that I do not wait for a database lookup to be told it is wrong.
- **U10. No re-login while signed in** *(Medium)*. As a logged-in user, opening `/login` takes me to my home page, so that I am not shown the form again.
- **U11. Blank form on arrival** *(Low)*. As a user, the login form is empty when I open it, so that I do not act on leftover input.

## 4. Acceptance checklist

Demo accounts (document §7.2), all with password `password123`:
`employee-1@budiman.com`, `supervisor-1@budiman.com`, `supervisor-2@budiman.com`,
`hr-1@budiman.com`, `hr-2@budiman.com`, `admin@budiman.com`.

| Status | ID | Check | How to test |
|--------|----|-------|-------------|
| To do | AC-01 | Each role logs in and lands on its own home page (U1) | • Open `/login`<br>• Sign in as `employee-1@budiman.com` / `password123`<br>• You should see the Employee home (`/employee`), not the login form<br>• Repeat for the supervisor, HR and admin demo users: each lands on its own home page |
| To do | AC-02 | One generic error for any bad login (U2) | • Open `/login`<br>• Enter `employee-1@budiman.com` and a wrong password → error "Email or password is wrong"<br>• Enter `nosuch@budiman.com` and `password123` → **the same** error message<br>• You should not see which of the two fields was wrong |
| To do | AC-03 | Protected pages need a login (U3) | • Log out / use a private window<br>• Open `/employee`, `/supervisor`, `/hr`, `/admin` directly<br>• Each should take you to `/login`, not show the page<br>• Then log in as `hr-1@budiman.com` → you should land on the HR home page |
| To do | AC-04 | Wrong-role pages bounce to own home (U4) | • Log in as `hr-1@budiman.com`<br>• Type `/employee` in the address bar<br>• You should be redirected to `/hr` with no "access denied" page<br>• Try `/admin` too → back to `/hr` |
| To do | AC-05 | Logout ends the session (U5) | • Log in as `admin@budiman.com`<br>• Click Log out<br>• You should be at `/login`<br>• Press the browser Back button or open `/admin` directly → you should be back at `/login`, not the admin page |
| To do | AC-06 | Demo data is seeded correctly (U6) | • With a fresh database (`npm run db:seed` or first run), check the Users table contains the six demo emails, correct roles and divisions, and a bcrypt hash (never the text `password123`) in the password field |
| To do | AC-07 | Login attempts are rate-limited (U7) | • Open `/login`<br>• Enter wrong credentials 6 times fast for `employee-1@budiman.com`<br>• From the 6th attempt you should get a "too many attempts, try again later" message instead of the normal error<br>• Wait about a minute and retry → normal login works again |
| To do | AC-08 | Remember me lasts 30 days; otherwise closing the browser ends the session (U8) | • On `/login`, tick "Remember me" and sign in as `employee-1@budiman.com`<br>• Close and reopen the browser → you should still be on the Employee home<br>• Check the session cookie in DevTools → expiry about 30 days ahead<br>• Log out, sign in **without** the tick, close and reopen the browser → you should be at `/login` |
| To do | AC-09 | Non-Budiman emails are rejected at the form (U9) | • Open `/login`<br>• Enter `someone@gmail.com` and `password123`, submit<br>• You should see "Use your @budiman.com work email" and no session should be created |
| To do | AC-10 | Signed-in users never see the login form (U10) | • Log in as `supervisor-1@budiman.com`<br>• Open `/login`<br>• You should be redirected to `/supervisor` |
| To do | AC-11 | Form starts empty (U11) | • Open `/login`, type something, go away, come back → the fields should be empty |

## 5. Not included (for now)

- Forgotten password, password change, or any email delivery — passwords come only from the seed (interview Q6).
- Server-side session revocation: logout only deletes the cookie; a signed cookie simply expires (interview Q2).
- Account lockout after N failures — rate limiting is the protection (interview Q3).
- Redirecting back to the page a visitor originally tried to open — login always goes to the role home (interview Q4).
- An "access denied" page for wrong-role attempts — the redirect to own home is silent (interview Q5).
- Showing demo accounts or hints on the login page — they are documented here and in the README (interview Q7).
- Registration or account management screens — users exist only via the seed.
- Multi-factor authentication.
- Anything from FR-02 … FR-09 (the leave flow) — those stories will be added to this file before their build.

---

# Leave Request – Requirements

> **This file answers:** What should the app do, and why?
> **Who:** The AI drafted it from the leave interview of 2026-11-20. You review it.
>
> When the app's behaviour needs to change, update this file **first**.
>
> Source of truth: `docs/Agentic AI - HRMS Doc.pdf` (§5 workflow, statuses and
> business rules; §6 FR-02…FR-08 and FR-10; §7.2 leave data) and the **leave
> interview of 2026-11-20** (Q1 calendar days inclusive · Q2 overlaps blocked ·
> Q3 cancel before signing · Q4 supervisors apply · Q5 no balances · Q6 block when
> no supervisor in division · Q7 admin table + status filter · Q8 server-rendered
> confirm step). This section covers **the leave flow** and sits below the login
> section, which is unchanged. Leave stories are **L1–L15**; acceptance checks
> continue the table above and run from **AC-12** to **AC-27**. Design rules
> **11–21** live in `02-design.md`; tasks **10–20** live in `03-tasks.md`.

## 1. The problem

Budiman's paper leave forms get lost, employees cannot see where their request is,
and HR has no single list of requests waiting for a decision (document §2). This
module gives every request one home: an employee (or supervisor, per interview Q4)
submits it, the assigned supervisor signs or rejects it, the employee then sends the
signed request to the shared HR queue, and any HR officer approves or rejects it.
The admin sees every record but changes nothing.

## 2. Workflow and statuses

One request walks: submit → supervisor signs → employee sends to HR → HR decides
(document §5.1). Statuses are those of document §5.2 plus **Cancelled**, added by
interview Q3:

| Status | Meaning | Final? |
|--------|---------|--------|
| Pending supervisor | Submitted. Waiting for the supervisor | no |
| Signed | The supervisor signed it. The employee can now send it to HR | no |
| Pending HR | Sent to HR. Waiting for a decision | no |
| Approved | HR approved it | **yes** |
| Rejected by supervisor | The supervisor rejected it, with a remark | **yes** |
| Rejected by HR | HR rejected it, with a remark | **yes** |
| Cancelled | The employee cancelled it while it was still Pending supervisor (interview Q3) | **yes** |

## 3. User stories

- **L1. Submit a leave request** *(High, FR-02)*. As an Employee (or Supervisor, see
  L13) I pick the leave type, the start and end dates and my supervisor, confirm once,
  and submit, so the request enters the flow as *Pending supervisor*. The type
  **Other** must come with a written description (document §7.2). *(AC-12, AC-13)*
- **L2. Pick a supervisor from my division** *(High, FR-02, §5.3 rule 3)*. The
  supervisor dropdown lists only Supervisor users from my own division, never me. If
  my division has no Supervisor, the form blocks submission and explains why
  (interview Q6). *(AC-14)*
- **L3. No double-booked leave** *(High, interview Q2)*. A submission whose dates
  overlap one of my own requests that is not Rejected or Cancelled is refused with a
  message naming the conflicting request. *(AC-15)*
- **L4. Duration in calendar days** *(Medium, interview Q1)*. The request shows its
  length as calendar days, start and end inclusive; a same-day request is 1 day; the
  end date is never before the start date. *(AC-13, AC-16)*
- **L5. Supervisor signs** *(High, FR-03)*. The assigned supervisor signs the
  requests waiting for them; only the assigned supervisor ever sees or acts on them.
  *(AC-17)*
- **L6. Supervisor rejection needs a remark** *(High, FR-03)*. A supervisor rejection
  requires a non-empty remark and is Final; the employee can read the remark. *(AC-18)*
- **L7. Employee sends the signed request to HR** *(High, FR-04)*. Once signed, I can
  send my request to the shared HR queue; until I do, HR does not see it
  (document §5.3 rule 5). *(AC-19)*
- **L8. HR decides, and is recorded** *(High, FR-05)*. Any HR officer (hr-1 or hr-2)
  approves or rejects queue items; a rejection requires a non-empty remark; the
  deciding officer and the decision date are recorded and never change; the decision
  is Final. *(AC-20)*
- **L9. Each role sees the right list** *(High, FR-06)*. Employees see their own
  requests; supervisors see requests assigned to them (plus the ones they applied for
  themselves); HR sees the whole Pending-HR queue plus past decisions; every list
  shows status and remarks — current and past. *(AC-21)*
- **L10. Confirm first, success after** *(High, FR-07)*. Every action — submit, sign,
  reject, send to HR, approve, reject (HR), cancel — shows a confirm panel first and a
  success message afterwards; cancelling the panel changes nothing. *(AC-22)*
- **L11. Cancel before signing** *(High, interview Q3)*. I can cancel my request while
  it is *Pending supervisor*; nothing is ever editable, so a wrong request means
  cancel and re-submit. *(AC-23)*
- **L12. Nobody decides their own request** *(High, interview Q4)*. A user cannot be
  the supervisor on their own request and cannot sign or decide any request they
  submitted. *(AC-24)*
- **L13. Supervisors may apply** *(Medium, interview Q4)*. A Supervisor submits and
  tracks leave exactly like an Employee; the other supervisor of their division signs
  it (the two Finance demo supervisors cover each other). HR and Admin never submit.
  *(AC-25)*
- **L14. Admin sees everything, changes nothing** *(Medium, FR-08)*. The admin list is
  one table of every request — employee, supervisor, type, dates, status — newest
  submitted first, with a status filter and no way to change data. *(AC-26)*
- **L15. Employee status filter** *(Low, FR-09)*. The employee's own list can be
  filtered by status. *(AC-27)*

## 4. Acceptance checklist

Same demo accounts as login §4 (all with password `password123`). **No leave
requests are seeded** — each check creates its own data; `npm run db:seed` restores
only the six users and the five leave types. "Confirm panel" means the server-side
confirm/cancel step (FR-07, design rule 20).

| Status | ID | Check | How to test |
|--------|----|-------|-------------|
| To do | AC-12 | Submit end to end (L1) | • Sign in as `employee-1@budiman.com` → `/employee` → **New leave request**<br>• Type: Annual leave · dates 2026-12-01 → 2026-12-05 · supervisor: Supervisor 1<br>• Submit → a confirm panel appears → confirm → success message<br>• In Prisma Studio the `LeaveRequest` row shows status `PENDING_SUPERVISOR`, `submittedAt` set, correct employee/supervisor/dates |
| To do | AC-13 | Form validation (L1, L4) | • On the same form, set end date before start date → error "End date cannot be before the start date"<br>• Type **Other** with an empty description → the field is marked required and the request is not submitted<br>• Type **Other** + description "House move" → it submits (AC-12 flow) |
| To do | AC-14 | Supervisor picker and empty division (L2) | • Open the form as `employee-1@budiman.com` → the supervisor dropdown shows **only** Supervisor 1 and Supervisor 2<br>• In DevTools change the dropdown's value to another user's id and submit → refused by the server<br>• In Prisma Studio set Employee 1's division to `Marketing`, sign in as them, open the form → a message explains no supervisor exists for the division and submission is blocked → restore division to `Finance` |
| To do | AC-15 | Overlaps blocked (L3) | • With the AC-12 request still active, submit a second one 2026-12-03 → 2026-12-10 → refused; the message names the conflicting request<br>• After the first request is Rejected (see AC-18) or Cancelled (see AC-23), the **same dates** submit again without a conflict |
| To do | AC-16 | Duration shown (L4) | • Open the 1–5 Dec request in the employee's list/detail → it reads **5 days**<br>• Submit a same-day request 2026-12-21 → 2026-12-21 → reads **1 day** |
| To do | AC-17 | Supervisor signs (L5) | • Sign in as `supervisor-1@budiman.com` → `/supervisor` shows the waiting request under "waiting for me"<br>• Sign → confirm panel → confirm → status **Signed** and the sign date recorded<br>• Sign in as `supervisor-2@budiman.com` → the request never appears in their list; opening its detail URL directly behaves as if the request does not exist |
| To do | AC-18 | Supervisor rejection needs a remark (L6) | • On a request waiting for you as `supervisor-1@budiman.com`, choose Reject with an empty remark → "Remark is required"<br>• Reject with a reason → status **Rejected by supervisor**; the employee sees the remark<br>• After that, no action button for the request appears anywhere, for anyone |
| To do | AC-19 | Send signed request to HR (L7) | • As `employee-1@budiman.com`, open the Signed request → **Send to HR** is offered → confirm → status **Pending HR** + success message<br>• Before that step the `/hr` queue does **not** list the request; after it, both `hr-1` and `hr-2` see it in the queue |
| To do | AC-20 | HR decides; officer recorded (L8) | • As `hr-1@budiman.com` open the queue → Approve → confirm → status **Approved**; the detail shows HR officer **HR 1** and the decision date<br>• On a second queue item, as `hr-2@budiman.com` choose Reject with an empty remark → "Remark is required"; then reject with a reason → **Rejected by HR**, officer **HR 2**<br>• Neither request offers any action afterwards — not to HR, not to the employee, not to the other HR officer |
| To do | AC-21 | Lists are scoped to the role (L9) | • `employee-1`'s list shows only their own requests, with status and remarks<br>• `supervisor-1`'s list shows only requests assigned to them — current **and** past — **plus** the requests they submitted themselves (L13)<br>• `/hr` (as `hr-1`) shows the whole Pending-HR queue regardless of division plus past decisions<br>• `/admin` shows every request, including requests other roles submitted themselves |
| To do | AC-22 | Confirm panel + success message (L10) | • For **each** action — submit, sign, reject, send to HR, approve, cancel — the first click shows a confirm panel and changes nothing<br>• Choose **Cancel** on the panel → the status is unchanged (check in Prisma Studio)<br>• Complete the action → a success message appears |
| To do | AC-23 | Cancel before signing (L11) | • On your own request while **Pending supervisor**, Cancel → confirm → status **Cancelled**; it disappears from any HR view<br>• Once **Signed** (and later), the employee's detail shows **no** cancel button<br>• Re-submitting the cancelled request's dates succeeds (overlap freed) |
| To do | AC-24 | No self-signing or self-deciding (L12) | • Sign in as `supervisor-1@budiman.com` and open New leave request → the dropdown offers Supervisor 2 but **not** themselves<br>• Tamper the form in DevTools to pick yourself → refused by the server<br>• In `supervisor-1`'s list and detail, their own signed request offers them **no Sign or Reject** anywhere (rule 21) — only the submitter's actions stay available (Send to HR, which AC-25 exercises) |
| To do | AC-25 | Supervisor applies end to end (L13) | • `supervisor-1` submits Unpaid leave 2027-01-04 → 2027-01-08 choosing Supervisor 2<br>• `supervisor-2` signs it → `supervisor-1` sends it to HR → `hr-1` approves<br>• Each step's list shows the matching status |
| To do | AC-26 | Admin table, view only (L14) | • Sign in as `admin@budiman.com` → the table lists every request (employee, supervisor, type, dates, status), newest **submitted** first<br>• The status filter narrows the table to exactly that status<br>• No button or link anywhere under `/admin` changes data |
| To do | AC-27 | Employee status filter (L15) | • As `employee-1`, use the status filter on their list → only rows with that status remain |

## 5. Secure by design — FR-10 applied to leave

- **Server checks every page and every action**: logged in, correct role, right
  person (owner / assigned supervisor / HR officer) and an allowed status transition.
  Hiding buttons is never the protection (design rules 15, 19).
- **Nothing from the browser is trusted**: form fields for status, ids and officer
  are ignored; the server reloads the request from the database before acting
  (OWASP A01 — broken access control).
- **Lists are scoped in the server's query** by role and identity — the page never
  receives all rows and hides some (design rule 19).
- **Remarks and "Other" text** are trimmed, length-limited (≤ 500 characters) and
  rendered as plain text (no HTML injection, OWASP A05).
- **Dates are validated on the server**: real dates, end not before start
  (L4), before anything is stored (OWASP A03 — injection via malformed input).
- The leave pages sit behind the **same session guard as login** (AC-03, AC-04):
  no route under `(home)/` renders without a verified session and matching role.

## 6. Not included (for now)

- Leave balances, entitlements or per-type limits — HR is the human control
  (interview Q5).
- Editing a submitted request — only Cancel before signing (interview Q3).
- Email or in-app notifications — each role checks its own list.
- Public-holiday or weekend calendars, half-days (interview Q1).
- HR or Admin submitting leave — no one above them could sign it (interview Q4).
- Choosing a supervisor outside your division, or an acting/stand-in supervisor.
- Deleting requests — Cancelled is the undo.
- Extra FR-09 features beyond L15 — specification first.
