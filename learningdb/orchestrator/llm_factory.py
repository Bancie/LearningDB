"""Factory helpers for LangChain chat model initialization."""

from __future__ import annotations

from typing import Any

from .config import Settings
from .providers import get_default_model_for_provider, is_supported_model


def build_chat_model(
    settings: Settings, provider: str | None = None, model: str | None = None
) -> tuple[Any, str, str]:
    """
    Build LangChain chat model lazily.

    Import is intentionally local so tests can run without LangChain installed.
    """
    resolved_provider = (provider or settings.default_provider).strip().lower()
    resolved_model = (model or settings.default_model).strip()

    if not is_supported_model(resolved_provider, resolved_model):
        resolved_model = get_default_model_for_provider(resolved_provider)

    if resolved_provider == "openai":
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is required for OpenAI provider.")
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(
            model=resolved_model,
            api_key=settings.openai_api_key,
            timeout=settings.request_timeout_seconds,
            temperature=0,
        )
        return llm, resolved_provider, resolved_model

    if resolved_provider == "anthropic":
        if not settings.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY is required for Anthropic provider.")
        from langchain_anthropic import ChatAnthropic

        llm = ChatAnthropic(
            model=resolved_model,
            api_key=settings.anthropic_api_key,
            timeout=settings.request_timeout_seconds,
            temperature=0,
        )
        return llm, resolved_provider, resolved_model

    raise ValueError(f"Unsupported provider: {resolved_provider}")
