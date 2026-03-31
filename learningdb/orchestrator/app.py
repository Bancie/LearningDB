"""FastAPI entrypoint for LangChain orchestrator service."""

from __future__ import annotations

import os
from time import perf_counter

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .audit import build_request_id, configure_logging, logger
from .chains import ChatOrchestrator, OrchestratorRuntime
from .config import Settings
from .exceptions import BackendServiceError, GuardrailViolation, OrchestratorError
from .providers import provider_catalog_for_ui
from .schemas import (
    ChatPreference,
    ChatRequest,
    ChatResponse,
    ErrorResponse,
    ProviderCatalogItem,
    UpsertChatPreferenceRequest,
)
from .tools import BackendApiClient

app = FastAPI(
    title="LearningDB LangChain Orchestrator",
    description="Chat orchestration service for read-only LearningDB tools.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_request_timing(request, call_next):
    started = perf_counter()
    response = await call_next(request)
    elapsed_ms = int((perf_counter() - started) * 1000)
    logger.info(
        "method=%s path=%s status=%s latency_ms=%s",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


@app.on_event("startup")
async def startup_event() -> None:
    configure_logging()
    settings = Settings.from_env()
    backend_client = BackendApiClient(settings)
    app.state.settings = settings
    app.state.backend_client = backend_client
    app.state.orchestrator = None
    try:
        app.state.orchestrator = ChatOrchestrator(
            OrchestratorRuntime(settings=settings, backend_client=backend_client)
        )
    except Exception as exc:  # pragma: no cover - boot-time fail-safe
        logger.warning("orchestrator_not_ready reason=%s", exc)
    logger.info("orchestrator_started backend=%s", settings.backend_base_url)


@app.on_event("shutdown")
async def shutdown_event() -> None:
    backend_client: BackendApiClient | None = getattr(app.state, "backend_client", None)
    if backend_client:
        await backend_client.close()


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy", "service": "learningdb-orchestrator"}


@app.get("/providers", response_model=list[ProviderCatalogItem])
async def providers_endpoint() -> list[ProviderCatalogItem]:
    env = {
        "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),
        "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY"),
    }
    return provider_catalog_for_ui(env)


@app.get("/chat/preferences/{user_id}", response_model=ChatPreference | None)
async def get_chat_preferences(user_id: int):
    backend_client: BackendApiClient = app.state.backend_client
    payload = await backend_client.get_json(f"/users/{user_id}/chat-preferences")
    data = payload.get("data")
    if data is None:
        return None
    return ChatPreference.model_validate(data)


@app.put("/chat/preferences/{user_id}", response_model=ChatPreference)
async def put_chat_preferences(user_id: int, request: UpsertChatPreferenceRequest):
    backend_client: BackendApiClient = app.state.backend_client
    payload = await backend_client.put_json(
        f"/users/{user_id}/chat-preferences", request.model_dump()
    )
    return ChatPreference.model_validate(payload["data"])


@app.post(
    "/chat",
    response_model=ChatResponse,
    responses={
        400: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
    },
)
async def chat_endpoint(payload: ChatRequest) -> ChatResponse:
    request_id = build_request_id()
    orchestrator: ChatOrchestrator | None = app.state.orchestrator
    if orchestrator is None:
        raise HTTPException(
            status_code=503,
            detail=ErrorResponse(
                request_id=request_id,
                error_code="ORCHESTRATOR_NOT_READY",
                message="Orchestrator is not initialized. Check model configuration.",
            ).model_dump(),
        )

    try:
        logger.info("request_id=%s event=chat_received", request_id)
        return await orchestrator.respond(request_id=request_id, chat=payload)
    except GuardrailViolation as exc:
        raise HTTPException(
            status_code=400,
            detail=ErrorResponse(
                request_id=request_id,
                error_code="GUARDRAIL_VIOLATION",
                message=str(exc),
            ).model_dump(),
        ) from exc
    except BackendServiceError as exc:
        raise HTTPException(
            status_code=502,
            detail=ErrorResponse(
                request_id=request_id,
                error_code="BACKEND_UNAVAILABLE",
                message=str(exc),
            ).model_dump(),
        ) from exc
    except OrchestratorError as exc:
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                request_id=request_id,
                error_code="ORCHESTRATOR_ERROR",
                message=str(exc),
            ).model_dump(),
        ) from exc
    except Exception as exc:  # pragma: no cover - fail-safe mapping
        raise HTTPException(
            status_code=500,
            detail=ErrorResponse(
                request_id=request_id,
                error_code="UNEXPECTED_ERROR",
                message=str(exc),
            ).model_dump(),
        ) from exc

