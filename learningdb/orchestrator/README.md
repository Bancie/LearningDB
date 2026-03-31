# LearningDB Orchestrator (LangChain Python)

Separate orchestration service for chat-based interactions with LearningDB backend APIs.

## MVP scope

- Read-only tools only (no DB writes from chatbot).
- Backend access through HTTP `/api` endpoints.
- LangChain tool-calling loop with guardrails.
- Request/tool audit logs with masked sensitive fields.

## Supported tools (MVP)

- `get_activity_list`
- `get_activity_view`
- `get_current_activity_log`
- `get_current_activity_output`
- `run_bayes`
- `check_prior`
- `get_tables`
- `get_table_columns`

## Environment variables

- `OPENAI_API_KEY`: API key for OpenAI provider.
- `ANTHROPIC_API_KEY`: API key for Anthropic provider.
- `ORCH_DEFAULT_PROVIDER`: default `openai`.
- `ORCH_DEFAULT_MODEL`: default `gpt-4.1-mini`.
- `ORCH_BACKEND_BASE_URL`: default `http://localhost:8000/api`.
- `ORCH_APP_HOST`: default `0.0.0.0`.
- `ORCH_APP_PORT`: default `8100`.
- `ORCH_REQUEST_TIMEOUT_SECONDS`: default `8.0`.
- `ORCH_BACKEND_MAX_RETRIES`: default `2`.
- `ORCH_BACKEND_RETRY_BACKOFF_SECONDS`: default `0.35`.

## Run

```bash
cd /Users/chibangnguyen/ayai/LearningDB
pip install -r requirements.txt
cd learningdb
uvicorn orchestrator.app:app --host 0.0.0.0 --port 8100
```

## Run with Docker Compose (recommended)

```bash
cd /Users/chibangnguyen/ayai/LearningDB
cp .env.example .env   # first time only
docker compose up --build
```

Available endpoints:

- Web: `http://localhost:3000`
- API: `http://localhost:8000/api/health`
- Orchestrator: `http://localhost:8100/health`

## Write-safe phase scaffold

`write_phase.py` already includes a two-step confirmation scaffold:

1. Build `ActionPreview` with `confirmation_token`.
2. Execute write action only when user explicitly confirms with valid token.
