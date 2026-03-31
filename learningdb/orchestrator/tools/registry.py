"""Whitelisted read-only tools mapped to backend endpoints."""

from __future__ import annotations

from dataclasses import dataclass
from time import perf_counter
from typing import Any, Awaitable, Callable

from pydantic import BaseModel

from ..config import Settings
from ..guardrails import clamp_limit
from .http_client import BackendApiClient
from .models import (
    CheckPriorInput,
    GetTableColumnsInput,
    GetTablesInput,
    RunBayesInput,
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


def build_read_only_registry(
    client: BackendApiClient, settings: Settings
) -> dict[str, ToolDefinition]:
    """Build all read-only tools for MVP."""

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
