# API context — `learningdb-second-app` (Google Stitch 6-file bundle)

This file merges the **bundle index** and **API brief** from `design/stitch-context/`. Full multi-file context stays there for repo use; **upload these 6 files together** to Google Stitch.

## What each companion file is

| File | Role |
| --- | --- |
| `openapi.snapshot.json` | Full OpenAPI 3 from FastAPI (authoritative schemas/paths). |
| `EXAMPLES.json` | All sample JSON payloads in one object (keys by scenario). |
| `postman.collection.json` | Postman v2.1 — same requests as the client smoke tests. |
| `TYPESCRIPT_REFERENCE.md` | TS interfaces aligned with `app/services/api.ts`. |
| `STITCH_SEED_PROMPT.md` | Paste-first prompt + rules for the design agent. |

Refresh `openapi.snapshot.json` from a running API: `./scripts/fetch-openapi.sh` (writes `design/stitch-context/`), then copy into this folder again.

---

# API brief (same as stitch-context/API_BRIEF.md)

## Runtime

| Role | URL / port | Ghi chú |
| --- | --- | --- |
| Second web UI (dev) | `http://localhost:3001` | React Router + MUI; không gọi orchestrator |
| FastAPI base (browser) | `{protocol}//{hostname}:8000/api` | Cùng host với trang, port 8000, path prefix `/api` |
| SSR / Docker build fallback | `VITE_API_BASE_URL` (default `http://localhost:8000/api`) | Khi không có `window` |

Resolver trong code: `learningdb-second-app/app/services/resolveApiBaseUrl.ts`.

## Orchestrator

**Không dùng** cho app này. Chat / LangChain ở service khác (port **8100**) — không nằm trong client của second app.

## CORS (backend)

FastAPI `learningdb/backend/main.py`: cho phép origin `localhost` / `127.0.0.1` / LAN với **mọi port** qua `allow_origin_regex`, nên UI `:3001` gọi API `:8000` được.

## Endpoints theo `app/services/api.ts`

Base path relative tới **`/api`** (axios `baseURL` đã gồm `/api`).

| Method | Path (sau `/api`) | Client function | Ghi chú |
| --- | --- | --- | --- |
| GET | `/health` | `getHealth` | `{ status: "healthy" }` |
| GET | `/tables` | `getTables` | `{ tables: string[] }` |
| GET | `/tables/{table}/columns` | `getTableColumns` | `{ columns: Column[] }` |
| POST | `/tables/insert` | `insertRecord` | Body: `{ table_name, data }` |
| GET | `/tables/{table}/rows` | `listTableRows` | Query: `limit`, `offset`, `sort_by`, `sort_dir`, `filters` (JSON string) |
| PATCH | `/tables/{table}/rows` | `updateTableRow` | Body: `{ primary_key, updates }` |
| DELETE | `/tables/{table}/rows` | `deleteTableRow` | Body: `{ primary_key }` |
| GET | `/activities` | `getActivityIds` | Query: `status` optional |
| GET | `/activities/list/{userId}` | `getActivityList` | `{ data: ActivityData[] }` |
| GET | `/activities/view/{userId}` | `getActivityView` | `{ data: ActivityData[] }` |
| GET | `/activities/current-log/{userId}` | `getCurrentActivityLog` | `{ data: ActivityLog[] }` |
| GET | `/activities/current-output/{userId}` | `getCurrentActivityOutput` | `{ data: ActivityOutput[] }` |
| POST | `/update/prior` | `updatePrior` | `{ activity_id, prob }` |
| POST | `/update/posterior` | `updatePosterior` | `{ activity_id, column_choice, prob }` |
| POST | `/update/status` | `updateStatus` | `{ activity_id, status }` |
| POST | `/update/zero` | `updateZero` | no body |
| GET | `/bayes/check-prior` | `checkPrior` | `{ valid, total, message }` |
| GET | `/bayes/run` | `runBayes` | Query: `total_minute` optional; `{ data: BayesResult[] }` |
| GET | `/users/{userId}/profile` | `getUserProfile` | `{ data: UserProfile }` |

**OpenAPI đầy đủ** (cả route chat DB trên cùng FastAPI app): `openapi.snapshot.json`. Second app hiện chỉ dùng các hàm trên trong `api.ts`.

## Gợi ý UX — màn “Data entry”

- **Generic CRUD:** chọn bảng (`GET /tables`) → cột (`GET .../columns`) → form động theo type/nullable/PK → list phân trang (`GET .../rows`) → insert / patch / delete.
- **Learning domain:** activities theo `user_id`, log/output; prior/posterior/status; Bayes nếu cần.
- **Lỗi:** axios 4xx/5xx — hiển thị message từ body JSON nếu có.

## Single source of truth trong repo

- `learningdb-second-app/app/services/api.ts`
- `learningdb-second-app/app/services/resolveApiBaseUrl.ts`

Bản đầy đủ nhiều file (để dev / tương lai): `learningdb-second-app/design/stitch-context/`.
