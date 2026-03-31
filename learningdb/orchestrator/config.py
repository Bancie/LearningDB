"""Runtime settings for the orchestrator service."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    """Application settings loaded from environment variables."""

    app_host: str = "0.0.0.0"
    app_port: int = 8100
    backend_base_url: str = "http://localhost:8000/api"
    default_provider: str = "openai"
    default_model: str = "gpt-4.1-mini"
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    request_timeout_seconds: float = 8.0
    backend_max_retries: int = 2
    backend_retry_backoff_seconds: float = 0.35
    tool_result_row_limit: int = 50
    max_tool_round_trips: int = 4
    enable_audit_logs: bool = True

    @classmethod
    def from_env(cls) -> "Settings":
        """Build settings from environment variables."""
        return cls(
            app_host=os.getenv("ORCH_APP_HOST", "0.0.0.0"),
            app_port=int(os.getenv("ORCH_APP_PORT", "8100")),
            backend_base_url=os.getenv(
                "ORCH_BACKEND_BASE_URL", "http://localhost:8000/api"
            ).rstrip("/"),
            default_provider=os.getenv("ORCH_DEFAULT_PROVIDER", "openai"),
            default_model=os.getenv("ORCH_DEFAULT_MODEL", "gpt-4.1-mini"),
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
            request_timeout_seconds=float(
                os.getenv("ORCH_REQUEST_TIMEOUT_SECONDS", "8.0")
            ),
            backend_max_retries=int(os.getenv("ORCH_BACKEND_MAX_RETRIES", "2")),
            backend_retry_backoff_seconds=float(
                os.getenv("ORCH_BACKEND_RETRY_BACKOFF_SECONDS", "0.35")
            ),
            tool_result_row_limit=int(os.getenv("ORCH_TOOL_RESULT_ROW_LIMIT", "50")),
            max_tool_round_trips=int(os.getenv("ORCH_MAX_TOOL_ROUND_TRIPS", "4")),
            enable_audit_logs=os.getenv("ORCH_ENABLE_AUDIT_LOGS", "1").lower()
            not in {"0", "false", "no"},
        )
