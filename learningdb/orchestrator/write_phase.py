"""Scaffold for future write-safe two-step confirmation flow."""

from __future__ import annotations

import hashlib
import json
import time
from typing import Any

from .schemas import ActionPreview


def build_confirmation_token(
    user_id: int, action_type: str, payload: dict[str, Any], ttl_seconds: int = 300
) -> str:
    """
    Build stateless confirmation token for future write operations.

    Token format is deterministic hash over action envelope and expiration.
    """
    expires_at = int(time.time()) + ttl_seconds
    envelope = {
        "user_id": user_id,
        "action_type": action_type,
        "payload": payload,
        "expires_at": expires_at,
    }
    encoded = json.dumps(envelope, sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(encoded.encode("utf-8")).hexdigest()
    return f"{expires_at}.{digest}"


def build_action_preview(
    user_id: int,
    action_type: str,
    summary: str,
    proposed_payload: dict[str, Any],
) -> ActionPreview:
    """Create response payload for step-1 preview in write phase."""
    token = build_confirmation_token(
        user_id=user_id, action_type=action_type, payload=proposed_payload
    )
    return ActionPreview(
        action_type=action_type,
        summary=summary,
        confirmation_token=token,
        requires_confirmation=True,
        proposed_payload=proposed_payload,
    )
