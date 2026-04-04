import asyncio
from typing import Any

from learningdb.orchestrator.config import Settings
from learningdb.orchestrator.exceptions import GuardrailViolation
from learningdb.orchestrator.tools.registry import build_tool_registry


class _FakeClient:
    def __init__(self) -> None:
        self.calls: list[tuple[str, str, dict[str, Any] | None]] = []

    async def get_json(
        self, path: str, params: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        self.calls.append(("GET", path, params))
        return {"data": []}

    async def post_json(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        self.calls.append(("POST", path, payload))
        return {"success": True, "data": payload}

    async def patch_json(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        self.calls.append(("PATCH", path, payload))
        return {"success": True, "data": payload}


def test_build_tool_registry_contains_write_tools() -> None:
    settings = Settings()
    client = _FakeClient()
    registry = build_tool_registry(client, settings)

    assert "insert_record" in registry
    assert "patch_table_row" in registry
    assert "update_prior" in registry
    assert "update_posterior" in registry
    assert "update_status" in registry


def test_insert_record_calls_backend_post() -> None:
    settings = Settings(write_table_allowlist=("activity",))
    client = _FakeClient()
    registry = build_tool_registry(client, settings)

    payload = asyncio.run(
        registry["insert_record"].handler(
            {"table_name": "activity", "data": {"ACTIVITY_ID": 999}}
        )
    )
    assert payload["source_endpoint"] == "/tables/insert"
    assert payload["result"]["table_name"] == "activity"
    assert client.calls[0][0] == "POST"


def test_patch_table_row_calls_backend_patch() -> None:
    settings = Settings(write_table_allowlist=("activity",))
    client = _FakeClient()
    registry = build_tool_registry(client, settings)

    payload = asyncio.run(
        registry["patch_table_row"].handler(
            {
                "table_name": "activity",
                "primary_key": {"ACTIVITY_ID": 1},
                "updates": {"ACT_STATUS": "done"},
            }
        )
    )
    assert payload["source_endpoint"] == "/tables/activity/rows"
    assert client.calls[0][0] == "PATCH"


def test_insert_record_blocks_disallowed_table() -> None:
    settings = Settings(write_table_allowlist=("activity",))
    client = _FakeClient()
    registry = build_tool_registry(client, settings)

    try:
        asyncio.run(
            registry["insert_record"].handler(
                {"table_name": "users", "data": {"id": 1}}
            )
        )
        assert False, "Expected GuardrailViolation"
    except GuardrailViolation:
        assert True
