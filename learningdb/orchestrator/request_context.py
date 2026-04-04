"""Per-request context for orchestration (async-safe via ContextVar)."""

from __future__ import annotations

from contextvars import ContextVar

# IANA timezone id from ChatRequest.user_timezone; None if unset or invalid client omit.
chat_user_timezone: ContextVar[str | None] = ContextVar(
    "chat_user_timezone", default=None
)
