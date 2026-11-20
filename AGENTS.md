# Budiman HRMS — Leave Request module

A web app that replaces Budiman Company's paper leave forms. Employees submit
leave requests, supervisors sign or reject them, HR approves or rejects them,
and the admin sees every record (view only). Built from scratch, spec first.

## Stack (fixed — do not add or swap tools without asking)

- Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- SQLite through Prisma; passwords hashed with bcryptjs, never plain text
- Login uses a signed session cookie; buttons and forms use server actions, no separate API

## Run it

- Node 20.9+. `npm install`, then `npm run dev` → http://localhost:3000
- Run `npm run lint` before every commit

## Where things live

- `docs/Agentic AI - HRMS Doc.pdf` — the brief and source of truth (§7.2 lists the data to keep)
- `docs/specs/` — the three specs: 01-requirements, 02-design, 03-tasks (copied from `docs/templates/`)
- `src/app/` — all app code

## How to work

- Build only from the specs in `docs/specs/`. If behaviour must change, fix the spec first, then the code.
- Do one task at a time from 03-tasks.md, High priority first. Mark a task Done only when its checks pass.
- Only logged-in users may use the system. One role per user (Employee, Supervisor, HR, Admin); never let a role open another role's pages.
- Secure by design: follow the OWASP Top 10 and the document's §7.5 in everything, not one screen at a time.
- Demo users (document §7.2) all log in with password123, stored hashed.
- Every commit message uses Conventional Commits: `feat: add login page`, `fix: ...`, `docs: ...`, `chore: ...`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
