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
