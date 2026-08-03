# API brief — `learningdb-second-app` (CRUD / FastAPI only)

## Runtime

| Role | URL / port | Ghi chú |
| --- | --- | --- |
| Second web UI (dev) | `http://localhost:3001` | React Router + MUI; không gọi orchestrator |
| FastAPI base (browser) | `{protocol}//{hostname}:8000/api` | Cùng host với trang, port 8000, path prefix `/api` |
| SSR / Docker build fallback | `VITE_API_BASE_URL` (default `http://localhost:8000/api`) | Khi không có `window` |

Resolver trong code: `app/services/resolveApiBaseUrl.ts`.

## Orchestrator

**Không dùng** cho app này. Chat / LangChain nằm ở service khác (port 8100) — không có trong bundle client của second app.

## CORS (backend)

FastAPI [`learningdb/backend/main.py`](../../../learningdb/backend/main.py): cho phép origin `localhost` / `127.0.0.1` / LAN với **mọi port** qua `allow_origin_regex`, nên UI chạy `:3001` vẫn gọi được API `:8000`.

## Endpoints theo `app/services/api.ts`

Base path dưới đây là relative tới **`/api`** (axios `baseURL` đã gồm `/api`).

| Method | Path (sau `/api`) | Client function | Ghi chú |
| --- | --- | --- | --- |
| GET | `/health` | `getHealth` | `{ status: "healthy" }` |
| GET | `/tables` | `getTables` | `{ tables: string[] }` |
| GET | `/tables/{table}/columns` | `getTableColumns` | `{ columns: Column[] }` |
| POST | `/tables/insert` | `insertRecord` | Body: `{ table_name, data }`. Response: `{ success, message, primary_key? }` — `primary_key` gồm tên cột PK (vd. `ACTI_LOG_ID`, `AO_ID`) sau insert auto-increment; dùng cho wizard import (`/import-wizard`) để nối bước 2–3 không cần nhập FK tay. |
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
| GET | `/import-wizard/draft` | `getImportWizardDraft` | Cookie session; `{ data: ImportDraftV1 \| null }` — draft import wizard theo user |
| PUT | `/import-wizard/draft` | `putImportWizardDraft` | Body `ImportDraftV1`; `{ data: ImportDraftV1 }` |
| DELETE | `/import-wizard/draft` | `deleteImportWizardDraft` | `{ success: true }` |

**OpenAPI đầy đủ** (gồm cả route chat DB trên cùng app FastAPI): xem `openapi.snapshot.json`. Second app **hiện** chỉ bundle các hàm trên trong `api.ts`; khi thêm endpoint mới, cập nhật `api.ts` + bảng này + examples.

## Import wizard (second app)

- Route: **`/import-wizard`** — luồng: `ACTIVITY_LOG` → `ACTIVITY_OUTPUT` → `KIT_COUNT` → optional specialty `KIT_*` (work type chọn ở bước 1), **draft lưu server** (`GET/PUT/DELETE /import-wizard/draft`, theo session), FK ẩn lấy từ `primary_key` của response insert bước trước.
- Tham chiếu UI Stitch (desktop/mobile + DESIGN): `learningdb-second-app/design/import-wizard-reference/`.

## Gợi ý UX — màn “Data entry”

- **Generic CRUD:** chọn bảng (`GET /tables`) → load cột (`GET .../columns`) → form động theo type/nullable/primary key → list có phân trang (`GET .../rows`) → insert / patch / delete row.
- **Learning domain:** activities theo `user_id`, log/output hiện tại; cập nhật prior/posterior/status; chạy Bayes từ UI nếu cần.
- **Lỗi:** axios trả 4xx/5xx — hiển thị message từ body nếu API trả JSON lỗi.

## Chi tiết schema

Dùng `openapi.snapshot.json` cho request/response schema chính xác theo Pydantic trên server.
