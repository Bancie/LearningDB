# LearningDB — second web app (CRUD)

Experimental React Router 7 + Vite + SSR + MUI + Tailwind front end that shares the **FastAPI** backend (`/api` on port **8000**). It does **not** use the LangChain orchestrator.

React Router / Vite here are pinned to **7.14 / 8.x** so dependency installs resolve cleanly; the main app under `learningdb/` may still use **7.12 / 7.x** — behavior should stay aligned for CRUD. This package uses **[Bun](https://bun.sh)** (`packageManager` in `package.json`, lockfile `bun.lock`).

## Import wizard (`/import-wizard`)

The multi-step importer writes through the FastAPI **`POST /api/tables/insert`** helpers (same CRUD backend as the main app):

1. **`ACTIVITY_LOG`** — wizard-only context; **work type** (`workType`) is a UI/draft select (specialty `KIT_*` table, excluding `KIT_COUNT`) and is **never** persisted on this row or any new SQL column.
2. **`ACTIVITY_OUTPUT`** — links via `ACTI_LOG_ID`; response provides `AO_ID`.
3. **`KIT_COUNT`** — one or more rows; **`AO_ID`** is injected automatically.
4. **Specialty kit** — **optional.** Shown only when Step 1 selects a work type (e.g. `KIT_READING`, `KIT_IELTS_LISTENING`, `KIT_WRITING`). Columns/load/insert target that table; **`AO_ID`** is injected automatically. Confirming Step 3 **Next** writes Kit count rows immediately; Step 4 **cannot navigate back** via the stepper (use **Discard** to abort).

**Drafts** (`GET/PUT /api/import-wizard/draft`) store `step` (**1–4**), field maps, **`workType`**, and **`specialtyRows`**. Older drafts with `includeReading` / `readingRows` are migrated client-side to `workType=KIT_READING` / `specialtyRows`.

Specialty kit options are discovered from **`GET /api/tables`** (names starting with `KIT_` except `KIT_COUNT`). Core tables `ACTIVITY_LOG`, `ACTIVITY_OUTPUT`, and `KIT_COUNT` must exist for the wizard to load.

## Ports

| App        | Dev / compose host port | Notes                                      |
| ---------- | ----------------------- | ------------------------------------------ |
| Main UI    | 3000                    | `learningdb/` — AI workspace + CRUD      |
| This app   | **3001**                | `bun run dev` binds `--port 3001`        |

## Commands

```bash
cd learningdb-second-app
bun install              # local
bun install --frozen-lockfile   # CI / reproducible (requires bun.lock)

bun run dev      # http://localhost:3001
bun run build
bun run start    # production SSR (after build)
bun run typecheck
```

Ensure the API is reachable (e.g. `docker compose up api` or your usual backend). The home page calls `GET /api/health`.

If `bun run start` ever misbehaves with `react-router-serve`, run the same script with Node as a fallback (install dependencies with npm/pnpm and use `npx react-router-serve ./build/server/index.js`).

## Environment (SSR / Docker build)

- `VITE_API_BASE_URL` — default `http://localhost:8000/api` in the Dockerfile; compose passes the same variable as the main `web` service for consistency.

## Design / Stitch

- **API context for Stitch / agents** (OpenAPI snapshot, `API_BRIEF.md`, JSON examples, Postman): [`design/stitch-context/README.md`](design/stitch-context/README.md). **Google Stitch (max 5 uploads):** same context flattened to [`design/stitch-google-5files/`](design/stitch-google-5files/) (upload all 5 files together).
- **Visual / tokens** from Stitch: `design/stitch/` — see [`design/stitch/README.md`](design/stitch/README.md); wire through `app/design-tokens.ts` and `app/theme.ts` as needed.

Refresh OpenAPI after backend changes: `./scripts/fetch-openapi.sh` (API must be on port 8000).

## Docker Compose

From the repo root, `web-second` builds this folder with **Bun** in the image and publishes **3001** → container **3000**, and only waits on the `api` service (not `orchestrator`).
