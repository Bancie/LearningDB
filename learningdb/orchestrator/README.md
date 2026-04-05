# LearningDB Orchestrator (LangChain Python)

Separate orchestration service for chat-based interactions with LearningDB backend APIs.

The `POST /chat` response field `answer` is the full assistant reply string (typically Markdown). Clients should use it as the source of truth for rendering and for copy-to-clipboard.

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

### Ollama (local or cloud)

- `ORCH_OLLAMA_BASE_URL`: Ollama API base URL. Use `http://127.0.0.1:11434` when the orchestrator process runs on the same host as Ollama. When the orchestrator runs **inside Docker** and Ollama runs on the host, use `http://host.docker.internal:11434` (Compose in this repo sets `extra_hosts` for Linux). Point at your Ollama Cloud base URL when using cloud-hosted models.
- `OLLAMA_API_KEY` / `ORCH_OLLAMA_API_KEY`: optional bearer for Ollama Cloud; passed to `ChatOllama` when set.
- `ORCH_OLLAMA_ENABLE_LOCAL`: set to `1`, `true`, `yes`, or `on` so the `/providers` catalog marks local allowlisted models (e.g. `gemma4:e4b`) as available without a cloud key.
- `ORCH_OLLAMA_FALLBACK_BASE_URL` + `ORCH_OLLAMA_FALLBACK_MODEL`: when both are set, a single failure from the primary Ollama endpoint with **HTTP 429**, **5xx** (500/502/503/504), or Ollama-cloud-style `Internal Server Error … (status code: 500)` triggers one switch to this fallback model for the rest of the request; responses may include warning `ollama_fallback_local`.

Allowlisted Ollama model tags are defined in `orchestrator/providers.py` and must match `ollama list` on your machine.

### Manual smoke test (Ollama + tools)

1. Run `ollama serve` (or ensure your cloud URL is reachable) and pull an allowlisted model.
2. Set `ORCH_DEFAULT_PROVIDER=ollama`, `ORCH_DEFAULT_MODEL` to that tag, and `ORCH_OLLAMA_ENABLE_LOCAL=1` if using a local-tagged model.
3. Start the orchestrator with `PYTHONPATH=/path/to/repo` (repo root) so `learningdb` imports resolve (see Run below).
4. `POST /chat` with a message that should trigger a read-only tool (e.g. listing activities); confirm `tool_invocations` in the response is non-empty when the model cooperates.

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
