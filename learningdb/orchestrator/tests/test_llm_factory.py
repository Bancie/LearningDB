"""Tests for LLM factory (including Ollama wiring)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from learningdb.orchestrator.config import Settings
from learningdb.orchestrator.llm_factory import build_chat_model, make_ollama_chat_model


def test_build_chat_model_ollama() -> None:
    settings = Settings(
        ollama_base_url="http://127.0.0.1:11434",
        ollama_api_key=None,
    )
    fake_llm = object()
    with patch("langchain_ollama.ChatOllama") as mock_cls:
        mock_cls.return_value = fake_llm
        llm, provider, model = build_chat_model(
            settings, provider="ollama", model="gemma4:e4b"
        )
    assert llm is fake_llm
    assert provider == "ollama"
    assert model == "gemma4:e4b"
    mock_cls.assert_called_once()
    call_kw = mock_cls.call_args.kwargs
    assert call_kw["model"] == "gemma4:e4b"
    assert call_kw["base_url"] == "http://127.0.0.1:11434"
    assert call_kw["temperature"] == 0
    assert "api_key" not in call_kw


def test_build_chat_model_ollama_passes_api_key_when_set() -> None:
    settings = Settings(
        ollama_base_url="https://ollama.example/v1",
        ollama_api_key="secret",
    )
    with patch("langchain_ollama.ChatOllama") as mock_cls:
        mock_cls.return_value = MagicMock()
        build_chat_model(settings, provider="ollama", model="gemma4:31b-cloud")
    call_kw = mock_cls.call_args.kwargs
    assert call_kw["api_key"] == "secret"


def test_make_ollama_chat_model_fallback_omits_empty_key() -> None:
    settings = Settings()
    with patch("langchain_ollama.ChatOllama") as mock_cls:
        mock_cls.return_value = MagicMock()
        make_ollama_chat_model(
            settings,
            model="gemma4:e4b",
            base_url="http://localhost:11434",
            api_key=None,
        )
    call_kw = mock_cls.call_args.kwargs
    assert "api_key" not in call_kw


def test_build_chat_model_unknown_provider() -> None:
    settings = Settings()
    with pytest.raises(ValueError, match="Unsupported provider"):
        build_chat_model(settings, provider="unknown", model="x")
