"""Input schemas for orchestrator tools."""

from __future__ import annotations

from pydantic import BaseModel, Field


class UserScopedInput(BaseModel):
    user_id: int = Field(gt=0)
    limit: int | None = Field(default=None, gt=0, le=1500)


class RunBayesInput(BaseModel):
    total_minute: float | None = Field(default=None, gt=0)


class CheckPriorInput(BaseModel):
    pass


class GetServerTimeInput(BaseModel):
    """No arguments; returns orchestrator wall-clock UTC."""

    pass


class GetTablesInput(BaseModel):
    pass


class GetTableColumnsInput(BaseModel):
    table_name: str = Field(min_length=1, max_length=128)


class InsertRecordInput(BaseModel):
    table_name: str = Field(min_length=1, max_length=128)
    data: dict = Field(default_factory=dict)


class TableRowPatchInput(BaseModel):
    table_name: str = Field(min_length=1, max_length=128)
    primary_key: dict[str, object] = Field(default_factory=dict)
    updates: dict[str, object] = Field(default_factory=dict)


class UpdatePriorInput(BaseModel):
    activity_id: int = Field(gt=0)
    prob: float


class UpdatePosteriorInput(BaseModel):
    activity_id: int = Field(gt=0)
    column_choice: int = Field(ge=1, le=3)
    prob: float


class UpdateStatusInput(BaseModel):
    activity_id: int = Field(gt=0)
    status: str = Field(min_length=1, max_length=64)
