"""Whitelisted tool registry mapped to backend endpoints."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from time import perf_counter
from typing import Any, Awaitable, Callable
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel

from ..config import Settings
from ..request_context import chat_user_timezone
from ..guardrails import clamp_limit, enforce_write_table_allowed
from .http_client import BackendApiClient
from .models import (
    CheckPriorInput,
    GetServerTimeInput,
    GetTableColumnsInput,
    GetTablesInput,
    InsertRecordInput,
    RunBayesInput,
    TableRowPatchInput,
    UpdatePosteriorInput,
    UpdatePriorInput,
    UpdateStatusInput,
    UserScopedInput,
)

ToolHandler = Callable[[dict[str, Any]], Awaitable[dict[str, Any]]]


@dataclass(frozen=True)
class ToolDefinition:
    """Defines a tool contract and backend mapping."""

    name: str
    description: str
    endpoint: str
    input_schema: type[BaseModel]
    handler: ToolHandler


def _limit_rows(items: list[Any], limit: int) -> list[Any]:
    return items[:limit]


def _normalize_result(payload: dict[str, Any], source_endpoint: str, limit: int) -> dict[str, Any]:
    if "data" in payload and isinstance(payload["data"], list):
        rows = _limit_rows(payload["data"], limit)
        return {"rows": rows, "count": len(rows), "source_endpoint": source_endpoint}

    if "tables" in payload and isinstance(payload["tables"], list):
        rows = [{"table_name": name} for name in payload["tables"]]
        rows = _limit_rows(rows, limit)
        return {"rows": rows, "count": len(rows), "source_endpoint": source_endpoint}

    if "columns" in payload and isinstance(payload["columns"], list):
        rows = _limit_rows(payload["columns"], limit)
        return {"rows": rows, "count": len(rows), "source_endpoint": source_endpoint}

    return {"rows": [payload], "count": 1, "source_endpoint": source_endpoint}


def _normalize_write_result(payload: dict[str, Any], source_endpoint: str) -> dict[str, Any]:
    """Normalize write endpoint payloads for tool responses."""
    result = payload.get("data", payload)
    return {"result": result, "source_endpoint": source_endpoint}


def build_tool_registry(client: BackendApiClient, settings: Settings) -> dict[str, ToolDefinition]:
    """Build read and write tool registry."""

    async def get_activity_list(args: dict[str, Any]) -> dict[str, Any]:
        parsed = UserScopedInput.model_validate(args)
        limit = clamp_limit(parsed.limit, settings.tool_result_row_limit)
        endpoint = f"/activities/list/{parsed.user_id}"
        payload = await client.get_json(endpoint)
        return _normalize_result(payload, endpoint, limit)

    async def get_activity_view(args: dict[str, Any]) -> dict[str, Any]:
        parsed = UserScopedInput.model_validate(args)
        limit = clamp_limit(parsed.limit, settings.tool_result_row_limit)
        endpoint = f"/activities/view/{parsed.user_id}"
        payload = await client.get_json(endpoint)
        return _normalize_result(payload, endpoint, limit)

    async def get_current_activity_log(args: dict[str, Any]) -> dict[str, Any]:
        parsed = UserScopedInput.model_validate(args)
        limit = clamp_limit(parsed.limit, settings.tool_result_row_limit)
        endpoint = f"/activities/current-log/{parsed.user_id}"
        payload = await client.get_json(endpoint)
        return _normalize_result(payload, endpoint, limit)

    async def get_current_activity_output(args: dict[str, Any]) -> dict[str, Any]:
        parsed = UserScopedInput.model_validate(args)
        limit = clamp_limit(parsed.limit, settings.tool_result_row_limit)
        endpoint = f"/activities/current-output/{parsed.user_id}"
        payload = await client.get_json(endpoint)
        return _normalize_result(payload, endpoint, limit)

    async def run_bayes(args: dict[str, Any]) -> dict[str, Any]:
        parsed = RunBayesInput.model_validate(args)
        params = {"total_minute": parsed.total_minute} if parsed.total_minute else None
        endpoint = "/bayes/run"
        payload = await client.get_json(endpoint, params=params)
        return _normalize_result(payload, endpoint, settings.tool_result_row_limit)

    async def check_prior(args: dict[str, Any]) -> dict[str, Any]:
        CheckPriorInput.model_validate(args)
        endpoint = "/bayes/check-prior"
        payload = await client.get_json(endpoint)
        return _normalize_result(payload, endpoint, settings.tool_result_row_limit)

    async def get_server_time(args: dict[str, Any]) -> dict[str, Any]:
        GetServerTimeInput.model_validate(args)
        now = datetime.now(timezone.utc).replace(microsecond=0)
        utc_iso8601 = now.isoformat().replace("+00:00", "Z")
        utc_sql_datetime = now.strftime("%Y-%m-%d %H:%M:%S")
        out: dict[str, Any] = {
            "utc_iso8601": utc_iso8601,
            "utc_sql_datetime": utc_sql_datetime,
            "source_endpoint": "orchestrator:get_server_time",
        }
        tz_name = (chat_user_timezone.get() or "").strip()
        if tz_name:
            try:
                z = ZoneInfo(tz_name)
                local = now.astimezone(z).replace(microsecond=0)
                out["user_timezone_iana"] = tz_name
                out["user_local_iso8601"] = local.isoformat()
                out["user_local_sql_datetime"] = local.strftime("%Y-%m-%d %H:%M:%S")
            except (ZoneInfoNotFoundError, OSError, ValueError):
                out["user_timezone_invalid"] = tz_name
        return out

    async def get_tables(args: dict[str, Any]) -> dict[str, Any]:
        GetTablesInput.model_validate(args)
        endpoint = "/tables"
        payload = await client.get_json(endpoint)
        return _normalize_result(payload, endpoint, settings.tool_result_row_limit)

    async def get_table_columns(args: dict[str, Any]) -> dict[str, Any]:
        parsed = GetTableColumnsInput.model_validate(args)
        endpoint = f"/tables/{parsed.table_name}/columns"
        payload = await client.get_json(endpoint)
        return _normalize_result(payload, endpoint, settings.tool_result_row_limit)

    async def insert_record(args: dict[str, Any]) -> dict[str, Any]:
        parsed = InsertRecordInput.model_validate(args)
        table_name = enforce_write_table_allowed(
            parsed.table_name, settings.write_table_allowlist
        )
        endpoint = "/tables/insert"
        payload = await client.post_json(
            endpoint,
            {
                "table_name": table_name,
                "data": parsed.data,
            },
        )
        return _normalize_write_result(payload, endpoint)

    async def patch_table_row(args: dict[str, Any]) -> dict[str, Any]:
        parsed = TableRowPatchInput.model_validate(args)
        table_name = enforce_write_table_allowed(
            parsed.table_name, settings.write_table_allowlist
        )
        endpoint = f"/tables/{table_name}/rows"
        payload = await client.patch_json(
            endpoint,
            {
                "primary_key": parsed.primary_key,
                "updates": parsed.updates,
            },
        )
        return _normalize_write_result(payload, endpoint)

    async def update_prior(args: dict[str, Any]) -> dict[str, Any]:
        parsed = UpdatePriorInput.model_validate(args)
        endpoint = "/update/prior"
        payload = await client.post_json(
            endpoint,
            {"activity_id": parsed.activity_id, "prob": parsed.prob},
        )
        return _normalize_write_result(payload, endpoint)

    async def update_posterior(args: dict[str, Any]) -> dict[str, Any]:
        parsed = UpdatePosteriorInput.model_validate(args)
        endpoint = "/update/posterior"
        payload = await client.post_json(
            endpoint,
            {
                "activity_id": parsed.activity_id,
                "column_choice": parsed.column_choice,
                "prob": parsed.prob,
            },
        )
        return _normalize_write_result(payload, endpoint)

    async def update_status(args: dict[str, Any]) -> dict[str, Any]:
        parsed = UpdateStatusInput.model_validate(args)
        endpoint = "/update/status"
        payload = await client.post_json(
            endpoint,
            {"activity_id": parsed.activity_id, "status": parsed.status},
        )
        return _normalize_write_result(payload, endpoint)

    definitions = [
        ToolDefinition(
            name="get_activity_list",
            description="Get latest activity list for a user.",
            endpoint="/activities/list/{user_id}",
            input_schema=UserScopedInput,
            handler=get_activity_list,
        ),
        ToolDefinition(
            name="get_activity_view",
            description="Get Bayes view rows for a user.",
            endpoint="/activities/view/{user_id}",
            input_schema=UserScopedInput,
            handler=get_activity_view,
        ),
        ToolDefinition(
            name="get_current_activity_log",
            description="Get current activity log rows for a user.",
            endpoint="/activities/current-log/{user_id}",
            input_schema=UserScopedInput,
            handler=get_current_activity_log,
        ),
        ToolDefinition(
            name="get_current_activity_output",
            description="Get current activity output rows for a user.",
            endpoint="/activities/current-output/{user_id}",
            input_schema=UserScopedInput,
            handler=get_current_activity_output,
        ),
        ToolDefinition(
            name="run_bayes",
            description="Run Bayes analysis optionally with total minutes.",
            endpoint="/bayes/run",
            input_schema=RunBayesInput,
            handler=run_bayes,
        ),
        ToolDefinition(
            name="check_prior",
            description="Check if prior sum is valid.",
            endpoint="/bayes/check-prior",
            input_schema=CheckPriorInput,
            handler=check_prior,
        ),
        ToolDefinition(
            name="get_server_time",
            description=(
                "Current wall time: utc_iso8601 and utc_sql_datetime (UTC). "
                "When the chat includes a user IANA timezone, also returns user_local_iso8601, "
                "user_local_sql_datetime, user_timezone_iana for that zone. "
                "Use for now/current time/hiện tại; prefer user_local_* when answering in the user's local clock; "
                "use utc_sql_datetime for DB datetime columns unless the user asks to store local wall time. "
                "Never invent a clock time."
            ),
            endpoint="orchestrator:get_server_time",
            input_schema=GetServerTimeInput,
            handler=get_server_time,
        ),
        ToolDefinition(
            name="get_tables",
            description="List database table names.",
            endpoint="/tables",
            input_schema=GetTablesInput,
            handler=get_tables,
        ),
        ToolDefinition(
            name="get_table_columns",
            description="Get schema columns for a table.",
            endpoint="/tables/{table_name}/columns",
            input_schema=GetTableColumnsInput,
            handler=get_table_columns,
        ),
        ToolDefinition(
            name="insert_record",
            description="Insert one record into an allowlisted table.",
            endpoint="/tables/insert",
            input_schema=InsertRecordInput,
            handler=insert_record,
        ),
        ToolDefinition(
            name="patch_table_row",
            description="Update one existing row by primary key in an allowlisted table.",
            endpoint="/tables/{table_name}/rows",
            input_schema=TableRowPatchInput,
            handler=patch_table_row,
        ),
        ToolDefinition(
            name="update_prior",
            description="Update ACT_PRIOR_PROB for an activity.",
            endpoint="/update/prior",
            input_schema=UpdatePriorInput,
            handler=update_prior,
        ),
        ToolDefinition(
            name="update_posterior",
            description="Update ACT_POSTERIOR_PROB_{1..3} for an activity.",
            endpoint="/update/posterior",
            input_schema=UpdatePosteriorInput,
            handler=update_posterior,
        ),
        ToolDefinition(
            name="update_status",
            description="Update ACT_STATUS for an activity.",
            endpoint="/update/status",
            input_schema=UpdateStatusInput,
            handler=update_status,
        ),
    ]
    return {item.name: item for item in definitions}


async def run_tool(
    registry: dict[str, ToolDefinition],
    tool_name: str,
    tool_args: dict[str, Any],
) -> tuple[dict[str, Any], int]:
    """Execute a tool and return payload with latency."""
    started = perf_counter()
    payload = await registry[tool_name].handler(tool_args)
    elapsed_ms = int((perf_counter() - started) * 1000)
    return payload, elapsed_ms
