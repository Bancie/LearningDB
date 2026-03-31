"""Custom exceptions for orchestrator control flow."""

from __future__ import annotations


class OrchestratorError(Exception):
    """Base orchestrator exception."""


class GuardrailViolation(OrchestratorError):
    """Raised when policy validation fails."""


class BackendServiceError(OrchestratorError):
    """Raised when backend API call fails."""

