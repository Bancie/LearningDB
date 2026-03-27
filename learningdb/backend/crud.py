"""
CRUD operations - ported from bayes.py
"""
import pandas as pd
from sqlalchemy import text, select, func, Table, MetaData
from database import engine

ALLOWED_STATUSES = {'not_started', 'in_progress', 'paused', 'completed', 'skipped', 'cancelled'}


def update_prior_prob(activity_id: int, prob: float):
    """Update the prior probability for a specific activity."""
    with engine.connect() as conn:
        conn.execute(
            text("""
                UPDATE `ACTIVITY`
                SET `PRIOR_PROB`= :p
                WHERE `ACTIVITY_ID`= :aid AND `ACT_STATUS`='in_progress'
            """),
            {"p": prob, "aid": activity_id}
        )
        conn.commit()


def update_posterior_prob(activity_id: int, column_choice: int, prob: float):
    """Update the posterior probability for a specific activity and column choice."""
    column_map = {
        1: "POSTERIOR_PROB_LEARNING",
        2: "POSTERIOR_PROB_OVERVIEW",
        3: "POSTERIOR_PROB_PRACTICE"
    }
    
    column_name = column_map.get(column_choice)
    if column_name is None:
        raise ValueError("Invalid column choice. Use 1 for LEARNING, 2 for OVERVIEW, 3 for PRACTICE.")
    
    with engine.begin() as conn:
        conn.execute(
            text(f"""
                UPDATE `ACTIVITY`
                SET {column_name} = :prob
                WHERE `ACTIVITY_ID` = :aid AND `ACT_STATUS` = 'in_progress'
            """),
            {"prob": prob, "aid": activity_id}
        )


def update_zero():
    """Set all prior and posterior probabilities to zero for activities not in progress."""
    with engine.begin() as conn:
        conn.execute(
            text("""
                UPDATE `ACTIVITY`
                SET `PRIOR_PROB` = 0,
                    `POSTERIOR_PROB_LEARNING` = 0,
                    `POSTERIOR_PROB_OVERVIEW` = 0,
                    `POSTERIOR_PROB_PRACTICE` = 0
                WHERE `ACT_STATUS` NOT LIKE 'in_progress'
            """)
        )


def check_prior() -> dict:
    """Check if the sum of prior probabilities equals 1.0."""
    metadata = MetaData()
    metadata.reflect(bind=engine)
    activity = metadata.tables['ACTIVITY']
    
    stmt = select(func.sum(activity.c.PRIOR_PROB))
    
    with engine.connect() as conn:
        total = conn.execute(stmt).scalar()
    
    total = total or 0
    is_valid = round(total, 4) == 1.0
    
    return {
        "valid": is_valid,
        "total": float(total),
        "message": "OK" if is_valid else f"Error! Sum = {total}"
    }


def run_bayes(total_minute: float = None) -> list:
    """Run the Bayesian analysis to calculate the probabilities for each activity."""
    query = text("""
        SELECT ACTIVITY_ID, ACT_NAME, PRIOR_PROB, 
               POSTERIOR_PROB_LEARNING, 
               POSTERIOR_PROB_OVERVIEW, 
               POSTERIOR_PROB_PRACTICE
        FROM bayes_act
    """)
    
    with engine.connect() as conn:
        df = pd.read_sql(query, conn)
    
    if df.empty:
        return []
    
    prior_sum = df['PRIOR_PROB'].sum()
    if prior_sum > 0:
        df['PRIOR_PROB'] = df['PRIOR_PROB'] / prior_sum
    
    posterior_cols = ['POSTERIOR_PROB_LEARNING', 'POSTERIOR_PROB_OVERVIEW', 'POSTERIOR_PROB_PRACTICE']
    row_sum = df[posterior_cols].sum(axis=1).replace(0, 1)
    df['Learn_ratio'] = df['POSTERIOR_PROB_LEARNING'] / row_sum
    df['Overview_ratio'] = df['POSTERIOR_PROB_OVERVIEW'] / row_sum
    df['Practice_ratio'] = df['POSTERIOR_PROB_PRACTICE'] / row_sum
    
    scale = total_minute if total_minute is not None else 1
    
    result = pd.DataFrame({
        'ACTIVITY_ID': df['ACTIVITY_ID'],
        'ACT_NAME': df['ACT_NAME'],
        'Total': df['PRIOR_PROB'] * scale,
        'Learning': df['PRIOR_PROB'] * df['Learn_ratio'] * scale,
        'Overview': df['PRIOR_PROB'] * df['Overview_ratio'] * scale,
        'Practice': df['PRIOR_PROB'] * df['Practice_ratio'] * scale,
    })
    
    result.iloc[:, 2:] = result.iloc[:, 2:].round(2)
    
    return result.to_dict(orient='records')


def update_status(activity_id: int, status: str):
    """Update the status of an activity."""
    if status not in ALLOWED_STATUSES:
        raise ValueError(f"Invalid status: '{status}'. Allowed values are: {ALLOWED_STATUSES}")
    
    with engine.begin() as conn:
        conn.execute(
            text("""
                UPDATE `ACTIVITY`
                SET `ACT_STATUS` = :status
                WHERE `ACTIVITY_ID` = :aid
            """),
            {"status": status, "aid": activity_id}
        )


def get_view(user_id: int) -> list:
    """Get the view for a specific user."""
    query = text("""
        SELECT `ACTIVITY_ID`, `ACT_NAME`, `PRIOR_PROB` as Total,
               `POSTERIOR_PROB_LEARNING` as Learning,
               `POSTERIOR_PROB_OVERVIEW` as Overview,
               `POSTERIOR_PROB_PRACTICE` as Practice
        FROM `bayes_act`
        WHERE `USER_ID` = :user_id
    """)
    
    with engine.connect() as conn:
        df = pd.read_sql(query, conn, params={"user_id": user_id})
    
    return df.to_dict(orient='records')


def get_activity_list(user_id: int) -> list:
    """Get the activity list for a specific user."""
    query = text("""
        SELECT `ACTIVITY_ID`, `ACT_NAME`, `ACT_STATUS`, `CREATED_AT`
        FROM `ACTIVITY`
        WHERE `USER_ID` = :user_id
        ORDER BY `CREATED_AT` DESC
    """)
    
    with engine.connect() as conn:
        df = pd.read_sql(query, conn, params={"user_id": user_id})
    
    # Convert datetime to string for JSON serialization
    if 'CREATED_AT' in df.columns:
        df['CREATED_AT'] = df['CREATED_AT'].apply(
            lambda x: x.strftime('%Y-%m-%d %H:%M:%S') if pd.notna(x) else ''
        )
    
    return df.to_dict(orient='records')


def get_current_activity_log(user_id: int) -> list:
    """Get the current activity log for a specific user."""
    query = text("""
        SELECT `ACTIVITY_ID`, `ACTI_LOG_ID`, `ACT_NAME`, `START_TIME`
        FROM `current_activity_log`
        WHERE `USER_ID` = :user_id
    """)
    
    with engine.connect() as conn:
        df = pd.read_sql(query, conn, params={"user_id": user_id})
    
    # Convert timedelta to string for JSON serialization
    if 'START_TIME' in df.columns:
        df['START_TIME'] = df['START_TIME'].apply(lambda x: str(x).split()[-1] if pd.notna(x) else '')
    
    return df.to_dict(orient='records')


def get_current_activity_output(user_id: int) -> list:
    """Get the current activity output for a specific user."""
    query = text("""
        SELECT `AO_ID`, `ACT_NAME`, `START_TIME`, `FINISH_TIME`
        FROM `current_activity_output`
        WHERE `USER_ID` = :user_id
    """)
    
    with engine.connect() as conn:
        df = pd.read_sql(query, conn, params={"user_id": user_id})
    
    # Convert timedelta to string for JSON serialization
    if 'START_TIME' in df.columns:
        df['START_TIME'] = df['START_TIME'].apply(lambda x: str(x).split()[-1] if pd.notna(x) else '')
    if 'FINISH_TIME' in df.columns:
        df['FINISH_TIME'] = df['FINISH_TIME'].apply(lambda x: str(x).split()[-1] if pd.notna(x) else '')
    
    return df.to_dict(orient='records')


def get_activity_ids(status: str = None) -> list:
    """Return a list of all ACTIVITY_IDs in the ACTIVITY table."""
    metadata = MetaData()
    metadata.reflect(bind=engine, only=["ACTIVITY"])
    activity = metadata.tables["ACTIVITY"]
    
    stmt = select(activity.c.ACTIVITY_ID)
    if status:
        stmt = stmt.where(activity.c.ACT_STATUS == status)
    
    with engine.connect() as conn:
        return [row[0] for row in conn.execute(stmt).all()]


def insert_record(table_name: str, data: dict):
    """Insert a record into a table."""
    metadata = MetaData()
    metadata.reflect(bind=engine, only=[table_name])
    table = metadata.tables[table_name]
    
    with engine.begin() as conn:
        conn.execute(table.insert(), data)
    
    return {"success": True, "message": f"Record inserted into {table_name}"}
