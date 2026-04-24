# Seed prompt for Google Stitch (paste with the other 5 files)

You are designing a **data-entry / CRUD** front end for **`learningdb-second-app`**: React 19, React Router 7, Vite, SSR, MUI + Tailwind, same visual language as a modern admin app.

## Hard constraints

1. **No orchestrator / no chat to port 8100.** Only **FastAPI** on **port 8000**, base path **`/api`**. In the browser, API URL is `{pageProtocol}//{pageHostname}:8000/api` (the dev UI runs on **port 3001**).
2. Prefer **MUI** components (forms, tables, dialogs, snackbar errors). Use **axios**-style semantics: JSON body, standard HTTP verbs.
3. Primary flows: **generic table CRUD** (pick table → columns → paginated rows → insert / patch / delete) plus optional **learning** flows from `API_CONTEXT.md` (activities, update, bayes, user profile).
4. Use **`openapi.snapshot.json`** for exact request/response schemas and status codes. Use **`EXAMPLES.json`** for realistic payload shapes. Use **`TYPESCRIPT_REFERENCE.md`** for field names and nested types. Use **`postman.collection.json`** to sanity-check paths mirror the client.
5. Respect **CORS**: app is served from another port than API; do not assume same-origin without port.

## Deliverable

Screens and components for a **“Data entry”** hub: table picker, dynamic form from `Column[]`, data grid with pagination/sort, row edit/delete confirmations, clear API error states. Optional secondary nav for activities / Bayes if space allows.

## Files you have in this upload

| File | Use |
| --- | --- |
| `API_CONTEXT.md` | Human-readable endpoints, ports, UX intent |
| `openapi.snapshot.json` | Machine-readable full API |
| `EXAMPLES.json` | Combined fixtures (`healthResponse`, `tablesResponse`, …) |
| `postman.collection.json` | Executable request list |
| `TYPESCRIPT_REFERENCE.md` | TS contracts for UI |
| `STITCH_SEED_PROMPT.md` | This file — rules + scope |

When in doubt, **`openapi.snapshot.json`** wins for schema; **`API_CONTEXT.md`** wins for which endpoints this app actually calls first.
