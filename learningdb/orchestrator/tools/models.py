"""Input schemas for orchestrator tools."""

from __future__ import annotations

from pydantic import BaseModel, Field


class UserScopedInput(BaseModel):
    user_id: int = Field(gt=0)
    limit: int | None = Field(default=None, gt=0, le=500)


class RunBayesInput(BaseModel):
    total_minute: float | None = Field(default=None, gt=0)


class CheckPriorInput(BaseModel):
    pass


class GetTablesInput(BaseModel):
    pass


class GetTableColumnsInput(BaseModel):
    table_name: str = Field(min_length=1, max_length=128)
