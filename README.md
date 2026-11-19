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
npm install     # install the tools (needs internet)
npm run dev     # start the app at http://localhost:3000
```

You should see a page that says the project is set up. If you do, you are ready.

**If something goes wrong**

| Problem | Fix |
|---------|-----|
| `npm install` fails while downloading Prisma engines | Your network blocks `binaries.prisma.sh`. Try another network, or ask the facilitator. |
| `Port 3000 is in use` | Another app is running. Stop it, or run `npm run dev -- -p 3001`. |
