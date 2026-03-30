"""
FastAPI Backend for LearningDB
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
try:
    from . import crud
    from .database import get_table_names, get_table_columns
except ImportError:
    import crud
    from database import get_table_names, get_table_columns

app = FastAPI(
    title="LearningDB API",
    description="Backend API for LearningDB tracking application",
    version="1.0.0"
)

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


class RunBayesRequest(BaseModel):
    total_minute: Optional[float] = None


# API Endpoints

@app.get("/")
def root():
    return {"message": "LearningDB API is running"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


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


# --- Activity Operations ---

@app.get("/api/activities")
def get_activity_ids(status: Optional[str] = None):
    """Get all activity IDs, optionally filtered by status"""
    try:
        ids = crud.get_activity_ids(status)
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
