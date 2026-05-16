# LearningDB — second web app (CRUD)

Experimental React Router 7 + Vite + SSR + MUI + Tailwind front end that shares the **FastAPI** backend (`/api` on port **8000**). It does **not** use the LangChain orchestrator.

React Router / Vite here are pinned to **7.14 / 8.x** so dependency installs resolve cleanly; the main app under `learningdb/` may still use **7.12 / 7.x** — behavior should stay aligned for CRUD. This package uses **[Bun](https://bun.sh)** (`packageManager` in `package.json`, lockfile `bun.lock`).

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
