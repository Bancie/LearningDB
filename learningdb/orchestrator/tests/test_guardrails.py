from learningdb.orchestrator.exceptions import GuardrailViolation
from learningdb.orchestrator.guardrails import clamp_limit, enforce_tool_allowlist


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
