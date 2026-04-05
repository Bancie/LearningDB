"""Tests for Ollama upstream errors that trigger local fallback."""

from __future__ import annotations

import httpx

from learningdb.orchestrator.chains.agent import _ollama_error_triggers_local_fallback


def test_detects_httpx_429() -> None:
    req = httpx.Request("POST", "http://127.0.0.1:11434/api/chat")
    resp = httpx.Response(429, request=req)
    exc = httpx.HTTPStatusError("too many", request=req, response=resp)
    assert _ollama_error_triggers_local_fallback(exc) is True


def test_detects_httpx_500() -> None:
    req = httpx.Request("GET", "http://example.test")
    resp = httpx.Response(500, request=req)
    exc = httpx.HTTPStatusError("err", request=req, response=resp)
    assert _ollama_error_triggers_local_fallback(exc) is True


def test_httpx_400_not_fallback() -> None:
    req = httpx.Request("GET", "http://example.test")
    resp = httpx.Response(400, request=req)
    exc = httpx.HTTPStatusError("bad", request=req, response=resp)
    assert _ollama_error_triggers_local_fallback(exc) is False


def test_message_heuristic_429() -> None:
    assert (
        _ollama_error_triggers_local_fallback(RuntimeError("Error 429: rate limit"))
        is True
    )


def test_ollama_cloud_response_error_message() -> None:
    msg = (
        "Internal Server Error (ref: 61ac56d0-33cf-41f5-bcdc-46ec6dc70d62) "
        "(status code: 500)"
    )
    assert _ollama_error_triggers_local_fallback(RuntimeError(msg)) is True
