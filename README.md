# Budiman HRMS

The project for the Leave Request module. It is set up and ready, but nothing
is built yet: you build it from the HRMS document, spec first.

## What is here

- `docs/Agentic AI - HRMS Doc.pdf`: the project document. What to build, for whom, and why, including the tables the database needs (section 7.2).
- `docs/templates/`: blank spec files (requirements, design, tasks) to copy.
- `docs/specs/`: where your specs go.
- `AGENTS.md`: the rules the AI follows in this project. You write the first version.
- A blank Next.js app with TypeScript and Tailwind CSS. Prisma and bcryptjs are listed in `package.json` but not set up yet.

## Getting started

You need **Node.js 20.9 or newer** (check with `node --version`) and Git.

```bash
npm install      # install the tools (needs internet)
npx prisma migrate dev   # create the SQLite database (prisma/dev.db)
npm run db:seed  # load the six demo users below
npm run dev      # start the app at http://localhost:3000
```

Opening http://localhost:3000 takes you to the login page.

## Logging in (demo accounts)

The login page deliberately shows no hints. The demo users (HRMS document §7.2)
are listed here instead. Everyone signs in with the password `password123`
(stored as a bcrypt hash, never plain text).

| Email | Name | Role | Division |
|-------|------|------|----------|
| `employee-1@budiman.com` | Employee 1 | Employee | Finance |
| `supervisor-1@budiman.com` | Supervisor 1 | Supervisor | Finance |
| `supervisor-2@budiman.com` | Supervisor 2 | Supervisor | Finance |
| `hr-1@budiman.com` | HR 1 | HR | Human Resources |
| `hr-2@budiman.com` | HR 2 | HR | Human Resources |
| `admin@budiman.com` | Admin | Admin | Admin |

Each role lands on its own home page: `/employee`, `/supervisor`, `/hr`,
`/admin`. Tick **Remember me** to stay signed in for 30 days; otherwise
closing the browser signs you out.

## Leave flow (demo walk)

The leave module replaces the paper form: employee submits, supervisor signs,
employee sends, HR decides, admin watches. Try it end to end with two browser
windows:

1. **employee-1@budiman.com** → *New leave request* → pick type, dates and
   Supervisor 1 → *Submit request* → confirm → the request appears in
   *My requests* as **Pending supervisor**.
2. **supervisor-1@budiman.com** → sees it under *Waiting for me* → opens it →
   *Sign* → confirm → status becomes **Signed**. (Rejecting needs a remark.)
3. **employee-1** again → the Signed request now offers *Send to HR* →
   confirm → status **Pending HR**, and it lands in the HR queue.
4. **hr-1@budiman.com** → sees the whole queue → opens the request →
   *Approve* → confirm → **Approved** (officer and decision date are stamped).
   Rejecting also requires a remark.

Every step needs the two-step confirm panel, final requests are read-only,
and nobody can decide on their own request. **admin@budiman.com** can watch
every request (with a status filter) but changes nothing. Supervisors apply
for leave themselves on the same form — their own request then goes through
the other supervisor.

**If something goes wrong**

| Problem | Fix |
|---------|-----|
| `npm install` fails while downloading Prisma engines | Your network blocks `binaries.prisma.sh`. Try another network, or ask the facilitator. |
| `Port 3000 is in use` | Another app is running. Stop it, or run `npm run dev -- -p 3001`. |
