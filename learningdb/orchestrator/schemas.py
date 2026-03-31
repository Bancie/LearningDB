"""Pydantic schemas for the LangChain orchestrator service."""

from __future__ import annotations

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class MessageRole(str, Enum):
    """Supported chat message roles."""

    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessage(BaseModel):
    """Single chat message used for short-term conversation context."""

    role: MessageRole
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    """Incoming chat request payload."""

    user_id: int = Field(gt=0)
    message: str = Field(min_length=1, max_length=4000)
    conversation_id: str | None = Field(default=None, max_length=128)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)
    provider: str | None = Field(default=None, max_length=64)
    model: str | None = Field(default=None, max_length=128)
    allow_write: bool = Field(
        default=False,
        description="Reserved for future write-safe phase. Must remain false in MVP.",
    )


class ToolInvocation(BaseModel):
    """Tool invocation trace returned to the caller."""

    name: str
    status: Literal["ok", "error", "blocked"]
    input: dict[str, Any]
    source_endpoint: str
    latency_ms: int = Field(ge=0)
    error: str | None = None


class ActionPreview(BaseModel):
    """
    Write-phase scaffold for two-step confirmation.

    This is intentionally optional in MVP read-only mode.
    """

    action_type: str
    summary: str
    confirmation_token: str
    requires_confirmation: bool = True
    proposed_payload: dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    """Successful chat response payload."""

    request_id: str
    conversation_id: str
    answer: str
    resolved_provider: str
    resolved_model: str
    tool_invocations: list[ToolInvocation] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    action_preview: ActionPreview | None = None


class ErrorResponse(BaseModel):
    """Standardized error payload."""

    request_id: str
    error_code: str
    message: str


class ChatPreference(BaseModel):
    user_id: int = Field(gt=0)
    provider: str = Field(min_length=1, max_length=64)
    model: str = Field(min_length=1, max_length=128)
    updated_at: str | None = None


class UpsertChatPreferenceRequest(BaseModel):
    provider: str = Field(min_length=1, max_length=64)
    model: str = Field(min_length=1, max_length=128)


class ProviderModel(BaseModel):
    id: str
    label: str
    available: bool


class ProviderCatalogItem(BaseModel):
    id: str
    label: str
    available: bool
    models: list[ProviderModel]
