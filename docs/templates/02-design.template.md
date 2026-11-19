# [Module name] – Design

> **This file answers:** How is the app put together? (data, rules, screens,
> where the code lives)
> **Who:** The AI drafts it. You review all of it.
>
> If this file and the requirements disagree, fix the requirements first,
> then this file.

## 1. Tables

> One table per kind of thing the app stores. List every field with its type,
> whether it is required, and what it holds. Every row gets an `id` automatically.

### `[TableName]` – [one row per …]

| Field | Type | Required? | What it holds |
|-------|------|-----------|---------------|
| `id` | number | auto | Unique number for the row |
| `[field]` | [text / number / date] | [yes / no] | [What it holds] |

## 2. Business rules

> Numbered rules the system must always follow: limits, who can do what,
> what must be unique, what each status means and who can change it.

1. **[Rule name].** [The rule, in one or two sentences.]

## 3. Technology

> Only fill this in for a new app. Say what you chose and, in plain words, why.

| Part | Choice | In plain words |
|------|--------|----------------|
| [Part] | [Tool] | [What it does for this app] |

## 4. Screens (routes)

> One row per screen. Say who can open it and what it shows.

| Route | Who | What it shows | Status |
|-------|-----|---------------|--------|
| `/[route]` | [Role] | [What the screen shows and does] | To do |

## 5. Where the code lives

> The folders and files the AI will create or change.

| Folder / file | What's in it |
|---------------|--------------|
| `[path]` | [What is in it] |

## 6. Security (in plain words)

> Who is checked, where, and how secrets are kept.

- [Every page checks …]
- [Every action checks again on the server …]

## 7. Commands

> The commands someone needs to run the app.

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the app at http://localhost:3000 |

---

# Reference

> Long lists you look things up in (fixed choices, demo data). Keep them here
> so the rules above stay short.

## Reference A. [Fixed lists]

- **[List name]:** [item], [item], [item]

## Reference B. Demo data

| Email | Name | Role |
|-------|------|------|
| `[name]@[company].com` | [Full name] | [Role] |
