from learningdb.orchestrator.exceptions import GuardrailViolation
from learningdb.orchestrator.guardrails import (
    clamp_limit,
    enforce_tool_allowlist,
    enforce_write_table_allowed,
)


def test_enforce_tool_allowlist_accepts_read_only() -> None:
    enforce_tool_allowlist("get_activity_list", allow_write=False)


def test_enforce_tool_allowlist_blocks_write_when_read_only_mode() -> None:
    try:
        enforce_tool_allowlist("update_status", allow_write=False)
        assert False, "Expected GuardrailViolation"
    except GuardrailViolation:
        assert True


def test_clamp_limit_bounds_requested_limit() -> None:
    assert clamp_limit(999, default_limit=50, max_limit=200) == 200
    assert clamp_limit(None, default_limit=50, max_limit=200) == 50
    assert clamp_limit(999, default_limit=50) == 600
    assert clamp_limit(None, default_limit=150) == 150


def test_enforce_tool_allowlist_accepts_write_when_enabled() -> None:
    enforce_tool_allowlist("update_status", allow_write=True)
    enforce_tool_allowlist("insert_record", allow_write=True)
    enforce_tool_allowlist("patch_table_row", allow_write=True)


def test_enforce_tool_allowlist_rejects_unknown_or_delete_tools() -> None:
    for blocked_tool in ("delete_record", "delete_table_row", "drop_table"):
        try:
            enforce_tool_allowlist(blocked_tool, allow_write=True)
            assert False, f"Expected GuardrailViolation for {blocked_tool}"
        except GuardrailViolation:
            assert True


def test_enforce_write_table_allowed() -> None:
    allowlist = ("activity", "activity_log")
    assert enforce_write_table_allowed("ACTIVITY", allowlist) == "activity"
    try:
        enforce_write_table_allowed("users", allowlist)
        assert False, "Expected GuardrailViolation for disallowed table"
    except GuardrailViolation:
        assert True
