# LearningDB — second web app (CRUD)

Experimental React Router 7 + Vite + SSR + MUI + Tailwind front end that shares the **FastAPI** backend (`/api` on port **8000**). It does **not** use the LangChain orchestrator.

React Router / Vite here are pinned to **7.14 / 8.x** so `npm install` resolves cleanly; the main app under `learningdb/` may still use **7.12 / 7.x** — behavior should stay aligned for CRUD.

## Ports

| App        | Dev / compose host port | Notes                                      |
| ---------- | ----------------------- | ------------------------------------------ |
| Main UI    | 3000                    | `learningdb/` — AI workspace + CRUD      |
| This app   | **3001**                | `npm run dev` binds `--port 3001`        |

## Commands

```bash
cd learningdb-second-app
npm ci
npm run dev      # http://localhost:3001
npm run build
npm run start    # production SSR (after build)
npm run typecheck
```

Ensure the API is reachable (e.g. `docker compose up api` or your usual backend). The home page calls `GET /api/health`.

## Environment (SSR / Docker build)

- `VITE_API_BASE_URL` — default `http://localhost:8000/api` in the Dockerfile; compose passes the same variable as the main `web` service for consistency.

## Design / Stitch

- **API context for Stitch / agents** (OpenAPI snapshot, `API_BRIEF.md`, JSON examples, Postman): [`design/stitch-context/README.md`](design/stitch-context/README.md). **Google Stitch (max 6 uploads):** same context flattened to [`design/stitch-google-6files/`](design/stitch-google-6files/) (upload all 6 files together).
- **Visual / tokens** from Stitch: `design/stitch/` — see [`design/stitch/README.md`](design/stitch/README.md); wire through `app/design-tokens.ts` and `app/theme.ts` as needed.

Refresh OpenAPI after backend changes: `./scripts/fetch-openapi.sh` (API must be on port 8000).

## Docker Compose

From the repo root, `web-second` builds this folder and publishes **3001** → container **3000**, and only waits on the `api` service (not `orchestrator`).
