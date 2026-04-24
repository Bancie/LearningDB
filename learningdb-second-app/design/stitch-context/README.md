# Stitch / design-agent API context (`learningdb-second-app` only)

Bundle này giúp **Google Stitch** (hoặc agent front-end khác) hiểu contract HTTP mà app thứ hai dùng: **chỉ FastAPI** trên port **8000**, prefix **`/api`**. App **không** gọi orchestrator (:8100).

## Mục lục

| File / thư mục | Mục đích |
| --- | --- |
| [`API_BRIEF.md`](API_BRIEF.md) | Tóm tắt cho người + LLM: URL, CORS, bảng endpoint theo client, gợi ý UX data entry |
| [`openapi.snapshot.json`](openapi.snapshot.json) | OpenAPI 3.x đầy đủ từ FastAPI (refresh khi đổi backend) |
| [`examples/`](examples/) | JSON mẫu: shape response/request thường gặp ([`examples/README.md`](examples/README.md)) |
| [`postman/LearningDB-second-app.postman_collection.json`](postman/LearningDB-second-app.postman_collection.json) | Import Postman/Bruno — gọi thử nhanh |
| [`TYPESCRIPT_CLIENT_REFERENCE.md`](TYPESCRIPT_CLIENT_REFERENCE.md) | Interface trùng với code; single source vẫn là `app/services/api.ts` |

Visual tokens / export Stitch UI đặt ở [`../stitch/README.md`](../stitch/README.md) (khác thư mục này).

## Google Stitch — giới hạn 5 file upload

Nếu Stitch chỉ cho **5 file**, dùng bản gom sẵn (không xóa thư mục này):

- **[`../stitch-google-5files/`](../stitch-google-5files/)** — đúng 5 file: `API_CONTEXT.md` (gom cả seed prompt), `openapi.snapshot.json`, `EXAMPLES.json`, `postman.collection.json`, `TYPESCRIPT_REFERENCE.md`.

Sau khi refresh OpenAPI trong `stitch-context`, copy `openapi.snapshot.json` (và chỉnh `EXAMPLES.json` / Postman nếu cần) vào `stitch-google-5files/` để hai bundle khớp.

## Làm mới `openapi.snapshot.json`

**Yêu cầu:** API đang chạy (ví dụ `docker compose up api` hoặc `learningdb serve`).

```bash
# Từ thư mục learningdb-second-app
./scripts/fetch-openapi.sh
```

Hoặc tay:

```bash
curl -sf http://127.0.0.1:8000/openapi.json -o design/stitch-context/openapi.snapshot.json
```

Sau khi sửa [`learningdb/backend/main.py`](../../../learningdb/backend/main.py) (route/schema), hãy chạy lại một trong hai lệnh trên rồi commit file snapshot mới.

## Upload lên Google Stitch (gợi ý workflow)

1. Zip cả thư mục `design/stitch-context/` **hoặc** chọn file: `API_BRIEF.md` + `openapi.snapshot.json` + vài file trong `examples/`.
2. Trong prompt Stitch, nói rõ: **front-end target** là app React/MUI tại repo path `learningdb-second-app`, port dev **3001**, chỉ dùng các endpoint trong `API_BRIEF.md` trừ khi có thêm yêu cầu.
3. Khi API đổi: refresh OpenAPI + cập nhật `API_BRIEF.md` / examples cho khớt.

## Single source of truth trong code

HTTP client và type: [`app/services/api.ts`](../../app/services/api.ts)  
Resolver base URL: [`app/services/resolveApiBaseUrl.ts`](../../app/services/resolveApiBaseUrl.ts)
