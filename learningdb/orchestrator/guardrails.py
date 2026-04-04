"""Policy and validation helpers for safe tool execution."""

from __future__ import annotations

from typing import Any

from .exceptions import GuardrailViolation

READ_ONLY_TOOLS = {
    "get_activity_list",
    "get_activity_view",
    "get_current_activity_log",
    "get_current_activity_output",
    "run_bayes",
    "check_prior",
    "get_tables",
    "get_table_columns",
}

WRITE_TOOLS = {
    "update_status",
    "update_prior",
    "update_posterior",
    "insert_record",
    "patch_table_row",
}


def enforce_tool_allowlist(tool_name: str, allow_write: bool = False) -> None:
    """Reject unknown tools and block write tools when write mode is disabled."""
    if tool_name in READ_ONLY_TOOLS:
        return
    if tool_name in WRITE_TOOLS and not allow_write:
        raise GuardrailViolation(
            f"Tool '{tool_name}' is write-capable and blocked in read-only mode."
        )
    if tool_name in WRITE_TOOLS:
        return
    raise GuardrailViolation(f"Tool '{tool_name}' is not in the allowlist.")


def is_write_tool(tool_name: str) -> bool:
    """Return whether tool mutates backend state."""
    return tool_name in WRITE_TOOLS


def enforce_write_table_allowed(table_name: str, allowlist: tuple[str, ...]) -> str:
    """Validate table_name is in orchestrator write allowlist."""
    normalized = table_name.strip().lower()
    if not normalized:
        raise GuardrailViolation("table_name is required for write operations.")
    if normalized not in allowlist:
        raise GuardrailViolation(
            f"table_name '{table_name}' is not allowed for write operations."
        )
    return normalized


def clamp_limit(raw_limit: int | None, default_limit: int, max_limit: int = 200) -> int:
    """Bound user/model-provided row limits to a safe range."""
    if raw_limit is None:
        return default_limit
    if raw_limit < 1:
        raise GuardrailViolation("Limit must be greater than zero.")
    return min(raw_limit, max_limit)


def require_user_id(payload: dict[str, Any], fallback_user_id: int) -> dict[str, Any]:
    """
    Ensure user_id is always present for user-scoped tools.

    The orchestrator owns user identity and should inject it if missing.
    """
    if "user_id" not in payload:
        payload["user_id"] = fallback_user_id
    return payload
