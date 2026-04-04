"""Scaffold for future write-safe two-step confirmation flow."""

from __future__ import annotations

import hashlib
import hmac
import json
import time
from base64 import urlsafe_b64decode, urlsafe_b64encode
from typing import Any

from .schemas import ActionPreview


def build_confirmation_token(
    user_id: int,
    action_type: str,
    payload: dict[str, Any],
    secret: str,
    ttl_seconds: int = 300,
) -> str:
    """
    Build stateless confirmation token for future write operations.

    Token format:
    <base64url(json_envelope)>.<hex_hmac_sha256_signature>
    """
    expires_at = int(time.time()) + ttl_seconds
    envelope = {
        "user_id": user_id,
        "action_type": action_type,
        "payload": payload,
        "expires_at": expires_at,
    }
    encoded = json.dumps(envelope, sort_keys=True, separators=(",", ":")).encode("utf-8")
    body = urlsafe_b64encode(encoded).decode("ascii").rstrip("=")
    signature = hmac.new(
        secret.encode("utf-8"),
        body.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()
    return f"{body}.{signature}"


def verify_confirmation_token(
    token: str,
    user_id: int,
    action_type: str,
    payload: dict[str, Any],
    secret: str,
) -> bool:
    """Validate signature, expiry, and action envelope match."""
    try:
        body, signature = token.split(".", maxsplit=1)
    except ValueError:
        return False

    expected_signature = hmac.new(
        secret.encode("utf-8"),
        body.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(signature, expected_signature):
        return False

    try:
        padded = body + "=" * (-len(body) % 4)
        envelope = json.loads(urlsafe_b64decode(padded.encode("ascii")).decode("utf-8"))
    except Exception:
        return False

    if not isinstance(envelope, dict):
        return False
    if envelope.get("user_id") != user_id:
        return False
    if envelope.get("action_type") != action_type:
        return False
    if envelope.get("payload") != payload:
        return False
    expires_at = envelope.get("expires_at")
    if not isinstance(expires_at, int):
        return False
    if expires_at < int(time.time()):
        return False
    return True


def extract_confirmed_action(
    token: str, secret: str
) -> tuple[str, int, dict[str, Any]] | None:
    """Decode and verify token, then return (action_type, user_id, payload)."""
    try:
        body, signature = token.split(".", maxsplit=1)
    except ValueError:
        return None

    expected_signature = hmac.new(
        secret.encode("utf-8"),
        body.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(signature, expected_signature):
        return None

    try:
        padded = body + "=" * (-len(body) % 4)
        envelope = json.loads(urlsafe_b64decode(padded.encode("ascii")).decode("utf-8"))
    except Exception:
        return None

    if not isinstance(envelope, dict):
        return None
    expires_at = envelope.get("expires_at")
    if not isinstance(expires_at, int) or expires_at < int(time.time()):
        return None
    action_type = envelope.get("action_type")
    user_id = envelope.get("user_id")
    payload = envelope.get("payload")
    if (
        not isinstance(action_type, str)
        or not isinstance(user_id, int)
        or not isinstance(payload, dict)
    ):
        return None
    return action_type, user_id, payload


def build_action_preview(
    user_id: int,
    action_type: str,
    summary: str,
    proposed_payload: dict[str, Any],
    secret: str,
    ttl_seconds: int = 300,
) -> ActionPreview:
    """Create response payload for step-1 preview in write phase."""
    token = build_confirmation_token(
        user_id=user_id,
        action_type=action_type,
        payload=proposed_payload,
        secret=secret,
        ttl_seconds=ttl_seconds,
    )
    return ActionPreview(
        action_type=action_type,
        summary=summary,
        confirmation_token=token,
        requires_confirmation=True,
        proposed_payload=proposed_payload,
    )
