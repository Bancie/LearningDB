"""
FastAPI Backend for LearningDB
"""
import json
import os
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import inspect, text
try:
    from . import crud
    from .database import get_table_names, get_table_columns, engine
except ImportError:
    import crud
    from database import get_table_names, get_table_columns, engine

app = FastAPI(
    title="LearningDB API",
    description="Backend API for LearningDB tracking application",
    version="1.0.0"
)

AUTH_COOKIE_NAME = "ldb_session"
AUTH_COOKIE_MAX_AGE_SECONDS = int(os.getenv("AUTH_COOKIE_MAX_AGE_SECONDS", str(72 * 3600)))
AUTH_COOKIE_SECURE = os.getenv("AUTH_COOKIE_SECURE", "0") in {"1", "true", "TRUE", "yes"}

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic Models
class UpdatePriorRequest(BaseModel):
    activity_id: int
    prob: float


class UpdatePosteriorRequest(BaseModel):
    activity_id: int
    column_choice: int  # 1=Learning, 2=Overview, 3=Practice
    prob: float


class UpdateStatusRequest(BaseModel):
    activity_id: int
    status: str


class InsertRecordRequest(BaseModel):
    table_name: str
    data: dict


class TableRowPatchRequest(BaseModel):
    primary_key: dict[str, Any]
    updates: dict[str, Any]


class TableRowDeleteRequest(BaseModel):
    primary_key: dict[str, Any]


class RunBayesRequest(BaseModel):
    total_minute: Optional[float] = None


class UpsertChatPreferenceRequest(BaseModel):
    provider: str
    model: str


class CreateConversationRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=120)
    provider: Optional[str] = Field(default=None, max_length=64)
    model: Optional[str] = Field(default=None, max_length=128)
    first_user_message: Optional[str] = Field(default=None, max_length=12000)


class AppendConversationMessageRequest(BaseModel):
    role: str
    content: str = Field(min_length=1, max_length=12000)
    request_id: Optional[str] = Field(default=None, max_length=128)


class AuthRegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=6, max_length=128)
    fullname: Optional[str] = Field(default=None, max_length=100)
    birth: Optional[str] = Field(default="2000-01-01", max_length=10)
    gender: Optional[str] = Field(default="other", max_length=10)
    major: Optional[str] = Field(default="General", max_length=100)
    user_location: Optional[str] = Field(default="Asia/Ho_Chi_Minh", max_length=100)


class AuthLoginRequest(BaseModel):
    login: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class AuthAccountUpdateRequest(BaseModel):
    username: str = Field(min_length=3, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    fullname: str = Field(default="", max_length=100)
    birth: str = Field(default="2000-01-01", max_length=10)
    gender: str = Field(default="other", max_length=10)
    major: str = Field(default="General", max_length=100)
    user_location: str = Field(default="Asia/Ho_Chi_Minh", max_length=100)


class AuthPasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class LoggingHistoryUpdateRequest(BaseModel):
    activity_log_updates: dict[str, Any] = Field(default_factory=dict)
    activity_output_updates: dict[str, Any] = Field(default_factory=dict)
    kit_rows: list[dict[str, Any]] = Field(default_factory=list)


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=AUTH_COOKIE_SECURE,
        max_age=AUTH_COOKIE_MAX_AGE_SECONDS,
        path="/",
    )


def _clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(key=AUTH_COOKIE_NAME, path="/")


def _resolve_session_user(session_token: str | None) -> dict:
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = crud.get_user_id_from_session_token(session_token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    user = crud.get_auth_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found for session")
    return user


# API Endpoints

@app.on_event("startup")
def startup_tasks():
    crud.ensure_auth_tables()
    crud.delete_expired_auth_sessions()
    crud.ensure_seed_user_account()

@app.get("/")
def root():
    return {"message": "LearningDB API is running"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


@app.post("/api/auth/register")
def register(request: AuthRegisterRequest, response: Response):
    try:
        user = crud.register_auth_user(
            username=request.username,
            email=request.email,
            password=request.password,
            fullname=request.fullname,
            birth=request.birth or "2000-01-01",
            gender=request.gender or "other",
            major=request.major or "General",
            user_location=request.user_location or "Asia/Ho_Chi_Minh",
        )
        token = crud.create_auth_session(int(user["user_id"]))
        _set_auth_cookie(response, token)
        return {"data": user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/login")
def login(request: AuthLoginRequest, response: Response):
    try:
        user = crud.authenticate_user(request.login, request.password)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid login or password")
        token = crud.create_auth_session(int(user["user_id"]))
        _set_auth_cookie(response, token)
        return {"data": user}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/auth/logout")
def logout(response: Response, session_token: str | None = Cookie(default=None, alias=AUTH_COOKIE_NAME)):
    try:
        if session_token:
            crud.delete_auth_session(session_token)
        _clear_auth_cookie(response)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/auth/me")
def me(session_token: str | None = Cookie(default=None, alias=AUTH_COOKIE_NAME)):
    try:
        user = _resolve_session_user(session_token)
        return {"data": user}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history/logging")
def get_logging_history(session_token: str | None = Cookie(default=None, alias=AUTH_COOKIE_NAME)):
    try:
        user = _resolve_session_user(session_token)
        data = crud.list_logging_history(int(user["user_id"]))
        return {"data": data}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history/logging/{acti_log_id}")
def get_logging_history_detail(
    acti_log_id: int,
    session_token: str | None = Cookie(default=None, alias=AUTH_COOKIE_NAME),
):
    try:
        user = _resolve_session_user(session_token)
        data = crud.get_logging_history_detail(int(user["user_id"]), acti_log_id)
        return {"data": data}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/history/logging/{acti_log_id}")
def update_logging_history_detail(
    acti_log_id: int,
    request: LoggingHistoryUpdateRequest,
    session_token: str | None = Cookie(default=None, alias=AUTH_COOKIE_NAME),
):
    try:
        user = _resolve_session_user(session_token)
        data = crud.update_logging_history_detail(
            user_id=int(user["user_id"]),
            acti_log_id=acti_log_id,
            activity_log_updates=request.activity_log_updates,
            activity_output_updates=request.activity_output_updates,
            kit_rows=request.kit_rows,
        )
        return {"data": data}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/history/logging/{acti_log_id}")
def delete_logging_history(
    acti_log_id: int,
    session_token: str | None = Cookie(default=None, alias=AUTH_COOKIE_NAME),
):
    try:
        user = _resolve_session_user(session_token)
        data = crud.delete_logging_session(user_id=int(user["user_id"]), acti_log_id=acti_log_id)
        return {"data": data}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/auth/account")
def get_account(session_token: str | None = Cookie(default=None, alias=AUTH_COOKIE_NAME)):
    try:
        user = _resolve_session_user(session_token)
        account = crud.get_account_settings(int(user["user_id"]))
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        return {"data": account}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/auth/account")
def update_account(
    request: AuthAccountUpdateRequest,
    session_token: str | None = Cookie(default=None, alias=AUTH_COOKIE_NAME),
):
    try:
        user = _resolve_session_user(session_token)
        updated = crud.update_account_settings(
            user_id=int(user["user_id"]),
            username=request.username,
            email=request.email,
            fullname=request.fullname,
            birth=request.birth,
            gender=request.gender,
            major=request.major,
            user_location=request.user_location,
        )
        return {"data": updated}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/auth/account/password")
def update_account_password(
    request: AuthPasswordChangeRequest,
    session_token: str | None = Cookie(default=None, alias=AUTH_COOKIE_NAME),
):
    try:
        user = _resolve_session_user(session_token)
        crud.change_account_password(
            user_id=int(user["user_id"]),
            current_password=request.current_password,
            new_password=request.new_password,
        )
        return {"success": True}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/users/{user_id}/profile")
def get_user_profile(user_id: int):
    """Public profile fields for UI (e.g. USER_LOCATION as IANA timezone)."""
    try:
        profile = crud.get_user_profile(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="User not found")
        return {"data": profile}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/users/{user_id}/chat-preferences")
def get_chat_preference(user_id: int):
    """Get provider/model preference for a user."""
    try:
        preference = crud.get_chat_preference(user_id)
        return {"data": preference}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/users/{user_id}/chat-preferences")
def upsert_chat_preference(user_id: int, request: UpsertChatPreferenceRequest):
    """Create or update provider/model preference for a user."""
    try:
        preference = crud.upsert_chat_preference(
            user_id=user_id, provider=request.provider, model=request.model
        )
        return {"data": preference}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/users/{user_id}/conversations")
def list_conversations(user_id: int):
    try:
        data = crud.list_conversations(user_id)
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/users/{user_id}/conversations")
def create_conversation(user_id: int, request: CreateConversationRequest):
    try:
        data = crud.create_conversation(
            user_id=user_id,
            title=request.title,
            provider=request.provider,
            model=request.model,
            first_user_message=request.first_user_message,
        )
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/users/{user_id}/conversations/{conversation_id}")
def delete_conversation(user_id: int, conversation_id: str):
    """Soft-delete a conversation."""
    try:
        data = crud.soft_delete_conversation(user_id=user_id, conversation_id=conversation_id)
        return {"data": data}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/users/{user_id}/conversations/{conversation_id}/messages")
def list_conversation_messages(user_id: int, conversation_id: str):
    try:
        data = crud.list_conversation_messages(
            user_id=user_id, conversation_id=conversation_id
        )
        return {"data": data}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/users/{user_id}/conversations/{conversation_id}/messages")
def append_conversation_message(
    user_id: int, conversation_id: str, request: AppendConversationMessageRequest
):
    try:
        data = crud.append_conversation_message(
            user_id=user_id,
            conversation_id=conversation_id,
            role=request.role,
            content=request.content,
            request_id=request.request_id,
        )
        return {"data": data}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Table Operations ---

@app.get("/api/tables")
def get_tables():
    """Get all table names from the database"""
    try:
        tables = get_table_names()
        return {"tables": tables}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tables/{table_name}/columns")
def get_columns(table_name: str):
    """Get column information for a specific table"""
    try:
        columns = get_table_columns(table_name)
        return {"columns": columns}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tables/insert")
def insert_record(request: InsertRecordRequest):
    """Insert a record into a table"""
    try:
        result = crud.insert_record(request.table_name, request.data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tables/{table_name}/rows")
def list_table_rows(
    table_name: str,
    limit: int = crud.TABLE_ROWS_DEFAULT_LIMIT,
    offset: int = 0,
    sort_by: Optional[str] = None,
    sort_dir: str = "asc",
    filters: Optional[str] = None,
):
    """List rows with pagination, optional JSON object `filters` (equality), and sort."""
    filter_obj: dict = {}
    if filters is not None and filters.strip():
        try:
            parsed = json.loads(filters)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="filters must be valid JSON object")
        if not isinstance(parsed, dict):
            raise HTTPException(status_code=400, detail="filters must be a JSON object")
        filter_obj = parsed
    try:
        return crud.list_table_rows(
            table_name,
            limit=limit,
            offset=offset,
            sort_by=sort_by,
            sort_dir=sort_dir.lower(),
            filters=filter_obj,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/tables/{table_name}/rows")
def patch_table_row(table_name: str, request: TableRowPatchRequest):
    try:
        return crud.update_table_row(table_name, request.primary_key, request.updates)
    except ValueError as e:
        msg = str(e)
        code = 404 if "No row matched" in msg else 400
        raise HTTPException(status_code=code, detail=msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/tables/{table_name}/rows")
def delete_table_row(table_name: str, request: TableRowDeleteRequest):
    try:
        return crud.delete_table_row(table_name, request.primary_key)
    except ValueError as e:
        msg = str(e)
        code = 404 if "No row matched" in msg else 400
        raise HTTPException(status_code=code, detail=msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Activity Operations ---

@app.get("/api/activities")
def get_activity_ids(status: Optional[str] = None):
    """Get all activity IDs, optionally filtered by status"""
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        activity_table = next((name for name in table_names if name.lower() == "activity"), None)
        if not activity_table:
            raise ValueError("ACTIVITY table not found in database.")

        columns = inspector.get_columns(activity_table)
        column_map = {col["name"].lower(): col["name"] for col in columns}
        id_col = column_map.get("activity_id")
        status_col = column_map.get("act_status")
        if not id_col:
            raise ValueError("ACTIVITY_ID column not found in activity table.")

        stmt = text(f"SELECT `{id_col}` FROM `{activity_table}`" + (f" WHERE `{status_col}` = :status" if status and status_col else ""))
        with engine.connect() as conn:
            rows = conn.execute(stmt, {"status": status} if status and status_col else {}).all()
            ids = [row[0] for row in rows]
        return {"activity_ids": ids}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/activities/list/{user_id}")
def get_activity_list(user_id: int):
    """Get activity list for a user"""
    try:
        data = crud.get_activity_list(user_id)
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/activities/view/{user_id}")
def get_view(user_id: int):
    """Get Bayes view for a user"""
    try:
        data = crud.get_view(user_id)
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/activities/current-log/{user_id}")
def get_current_activity_log(user_id: int):
    """Get current activity log for a user"""
    try:
        data = crud.get_current_activity_log(user_id)
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/activities/current-output/{user_id}")
def get_current_activity_output(user_id: int):
    """Get current activity output for a user"""
    try:
        data = crud.get_current_activity_output(user_id)
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Update Operations ---

@app.post("/api/update/prior")
def update_prior(request: UpdatePriorRequest):
    """Update prior probability for an activity"""
    try:
        crud.update_prior_prob(request.activity_id, request.prob)
        return {"success": True, "message": f"Prior for activity {request.activity_id} set to {request.prob}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/update/posterior")
def update_posterior(request: UpdatePosteriorRequest):
    """Update posterior probability for an activity"""
    try:
        crud.update_posterior_prob(request.activity_id, request.column_choice, request.prob)
        return {"success": True, "message": f"Posterior #{request.column_choice} for activity {request.activity_id} set to {request.prob}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/update/status")
def update_status(request: UpdateStatusRequest):
    """Update status for an activity"""
    try:
        crud.update_status(request.activity_id, request.status)
        return {"success": True, "message": f"Status for activity {request.activity_id} updated to {request.status}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/update/zero")
def update_zero():
    """Zero out probabilities for non-in_progress activities"""
    try:
        crud.update_zero()
        return {"success": True, "message": "All non-in_progress activities have been zeroed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- Bayes Operations ---

@app.get("/api/bayes/check-prior")
def check_prior():
    """Check if the sum of prior probabilities equals 1.0"""
    try:
        result = crud.check_prior()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/bayes/run")
def run_bayes(request: RunBayesRequest):
    """Run Bayesian analysis"""
    try:
        data = crud.run_bayes(request.total_minute)
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/bayes/run")
def run_bayes_get(total_minute: Optional[float] = None):
    """Run Bayesian analysis (GET version)"""
    try:
        data = crud.run_bayes(total_minute)
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
