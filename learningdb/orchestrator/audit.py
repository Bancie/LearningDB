"""Audit logging utilities for requests and tool execution."""

from __future__ import annotations

import logging
import time
import uuid
from collections.abc import Mapping
from typing import Any

SENSITIVE_KEYS = {"password", "token", "authorization", "api_key", "secret"}

logger = logging.getLogger("learningdb.orchestrator")


def configure_logging() -> None:
    """Initialize basic logging once for the service process."""
    if logger.handlers:
        return
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )


def build_request_id() -> str:
    """Create trace id for each request."""
    return str(uuid.uuid4())


def mask_sensitive(data: Any) -> Any:
    """Mask sensitive values in nested structures before logging."""
    if isinstance(data, Mapping):
        return {
            key: ("***" if key.lower() in SENSITIVE_KEYS else mask_sensitive(value))
            for key, value in data.items()
        }
    if isinstance(data, list):
        return [mask_sensitive(item) for item in data]
    return data


def now_ms() -> int:
    """Get current epoch time in milliseconds."""
    return int(time.time() * 1000)
