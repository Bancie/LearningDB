# LearningDB — second web app (CRUD)

Experimental React Router 7 + Vite + SSR + MUI + Tailwind front end that shares the **FastAPI** backend (`/api` on port **8000**). It does **not** use the LangChain orchestrator.

React Router / Vite here are pinned to **7.14 / 8.x** so dependency installs resolve cleanly; the main app under `learningdb/` may still use **7.12 / 7.x** — behavior should stay aligned for CRUD. This package uses **[Bun](https://bun.sh)** (`packageManager` in `package.json`, lockfile `bun.lock`).

## Import wizard (`/import-wizard`)

The multi-step importer writes through the FastAPI **`POST /api/tables/insert`** helpers (same CRUD backend as the main app):

1. **`ACTIVITY_LOG`** — wizard-only context; **Reading** (`includeReading`) is a UI/draft checkbox and is **never** persisted on this row or any new SQL column.
2. **`ACTIVITY_OUTPUT`** — links via `ACTI_LOG_ID`; response provides `AO_ID`.
3. **`KIT_COUNT`** — one or more rows; **`AO_ID`** is injected automatically.
4. **`KIT_READING`** — **optional.** Shown only when Step 1 has Reading enabled (`includeReading`). Inserts mirror Kit count (**`AO_ID`** injected automatically). Multiple rows use the **+ Add kit reading row** control. Confirming Step 3 **Next** writes Kit count rows immediately; Kit Reading stays on Step 4 and **cannot navigate back** to earlier steps via the stepper (use **Discard** to abort).

**Drafts** (`GET/PUT /api/import-wizard/draft`) store `step` (**1–4**), both table field maps, **`includeReading`**, and **`readingRows`**.

The deployed database **must expose a `KIT_READING` table** (case-insensitive name match via `/api/tables`) for the wizard to load; otherwise schema resolution fails on startup like any other missing table.

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
