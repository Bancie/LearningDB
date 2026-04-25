"""
CRUD operations - ported from bayes.py
"""
import os
import base64
import hashlib
import hmac
import secrets
import uuid
from decimal import Decimal

import pandas as pd
from sqlalchemy import and_, asc, desc, inspect as sa_inspect, text, select, func, MetaData
try:
    from .database import engine, get_table_names
except ImportError:
    from database import engine, get_table_names

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


def _resolve_history_tables() -> dict[str, str]:
    return {
        "log": resolve_browser_table_name("ACTIVITY_LOG"),
        "output": resolve_browser_table_name("ACTIVITY_OUTPUT"),
        "kit": resolve_browser_table_name("KIT_COUNT"),
        "activity": resolve_browser_table_name("ACTIVITY"),
    }


def _get_table_columns_set(table_name: str) -> set[str]:
    metadata = MetaData()
    metadata.reflect(bind=engine, only=[table_name])
    table = metadata.tables[table_name]
    return {c.name for c in table.columns}


def _get_row_by_pk(table_name: str, primary_key: dict) -> dict | None:
    metadata = MetaData()
    metadata.reflect(bind=engine, only=[table_name])
    table = metadata.tables[table_name]
    where_parts = [table.c[k] == primary_key[k] for k in primary_key]
    stmt = select(table).where(and_(*where_parts)).limit(1)
    with engine.connect() as conn:
        row = conn.execute(stmt).mappings().first()
    return dict(row) if row else None


def _extract_pk_dict_from_row(table_name: str, row: dict) -> dict:
    pk_cols = _get_pk_columns(table_name)
    return {k: row[k] for k in pk_cols if k in row}


def list_logging_history(user_id: int) -> list[dict]:
    tables = _resolve_history_tables()
    q = text(
        f"""
        WITH kit_agg AS (
            SELECT
                x.`AO_ID`,
                GROUP_CONCAT(CONCAT(x.`sum_total`, ' ', x.`UNIT_COUNT`) ORDER BY x.`UNIT_COUNT` SEPARATOR ', ') AS kit_summary,
                SUM(x.`sum_total`) AS total_count
            FROM (
                SELECT
                    k.`AO_ID`,
                    k.`UNIT_COUNT`,
                    SUM(k.`TOTAL_COUNT`) AS sum_total
                FROM `{tables["kit"]}` k
                GROUP BY k.`AO_ID`, k.`UNIT_COUNT`
            ) x
            GROUP BY x.`AO_ID`
        )
        SELECT
            l.`ACTI_LOG_ID` AS acti_log_id,
            l.`ACTIVITY_ID` AS activity_id,
            a.`ACT_NAME` AS activity_name,
            l.`ACTLOG_START` AS start_time,
            o.`AO_ID` AS ao_id,
            o.`AO_FINISH` AS finish_time,
            COALESCE(ka.`kit_summary`, '') AS kit_summary,
            COALESCE(ka.`total_count`, 0) AS total_count,
            COALESCE(o.`AO_FINISH`, l.`ACTLOG_START`) AS logged_at,
            CASE
                WHEN o.`AO_FINISH` IS NULL OR l.`ACTLOG_START` IS NULL THEN NULL
                ELSE TIMESTAMPDIFF(MINUTE, l.`ACTLOG_START`, o.`AO_FINISH`)
            END AS duration_minutes
        FROM `{tables["log"]}` l
        LEFT JOIN `{tables["output"]}` o
          ON o.`ACTI_LOG_ID` = l.`ACTI_LOG_ID`
        LEFT JOIN kit_agg ka
          ON ka.`AO_ID` = o.`AO_ID`
        LEFT JOIN `{tables["activity"]}` a
          ON a.`ACTIVITY_ID` = l.`ACTIVITY_ID`
        WHERE l.`USER_ID` = :user_id
          AND o.`AO_ID` IS NOT NULL
          AND COALESCE(ka.`total_count`, 0) > 0
          AND COALESCE(o.`AO_FINISH`, l.`ACTLOG_START`) >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)
        GROUP BY
            l.`ACTI_LOG_ID`,
            l.`ACTIVITY_ID`,
            a.`ACT_NAME`,
            l.`ACTLOG_START`,
            o.`AO_ID`,
            o.`AO_FINISH`,
            ka.`kit_summary`,
            ka.`total_count`
        ORDER BY COALESCE(o.`AO_FINISH`, l.`ACTLOG_START`) DESC
        """
    )
    with engine.connect() as conn:
        rows = conn.execute(q, {"user_id": user_id}).mappings().all()

    out: list[dict] = []
    for row in rows:
        out.append(
            {
                "acti_log_id": int(row["acti_log_id"]),
                "activity_id": int(row["activity_id"]) if row["activity_id"] is not None else None,
                "activity_name": str(row["activity_name"]) if row["activity_name"] is not None else None,
                "start_time": _serialize_cell(row["start_time"]),
                "ao_id": int(row["ao_id"]) if row["ao_id"] is not None else None,
                "finish_time": _serialize_cell(row["finish_time"]),
                "kit_summary": str(row["kit_summary"] or ""),
                "total_count": float(row["total_count"] or 0),
                "logged_at": _serialize_cell(row["logged_at"]),
                "duration_minutes": int(row["duration_minutes"]) if row["duration_minutes"] is not None else None,
            }
        )
    return out


def get_logging_history_detail(user_id: int, acti_log_id: int) -> dict:
    tables = _resolve_history_tables()
    history_items = list_logging_history(user_id)
    summary = next((item for item in history_items if item["acti_log_id"] == acti_log_id), None)
    if not summary:
        raise ValueError("Logging history item not found.")

    log_row = _get_row_by_pk(tables["log"], {"ACTI_LOG_ID": acti_log_id})
    if not log_row or int(log_row.get("USER_ID", -1)) != user_id:
        raise ValueError("Logging history item not found.")

    output_row = None
    if summary["ao_id"] is not None:
        output_row = _get_row_by_pk(tables["output"], {"AO_ID": int(summary["ao_id"])})

    kit_rows: list[dict] = []
    if summary["ao_id"] is not None:
        q = text(f"SELECT * FROM `{tables['kit']}` WHERE `AO_ID` = :ao_id")
        with engine.connect() as conn:
            rows = conn.execute(q, {"ao_id": int(summary["ao_id"])}).mappings().all()
            kit_rows = [dict(row) for row in rows]

    return {
        "summary": summary,
        "activity_log": _row_mapping_to_dict(log_row),
        "activity_output": _row_mapping_to_dict(output_row) if output_row else None,
        "kit_rows": [_row_mapping_to_dict(row) for row in kit_rows],
    }


def update_logging_history_detail(
    *,
    user_id: int,
    acti_log_id: int,
    activity_log_updates: dict,
    activity_output_updates: dict,
    kit_rows: list[dict],
) -> dict:
    tables = _resolve_history_tables()
    detail = get_logging_history_detail(user_id, acti_log_id)
    summary = detail["summary"]
    ao_id = summary.get("ao_id")

    log_pk = {"ACTI_LOG_ID": acti_log_id}
    current_log_row = _get_row_by_pk(tables["log"], log_pk)
    if not current_log_row:
        raise ValueError("ACTIVITY_LOG row not found.")

    log_columns = _get_table_columns_set(tables["log"])
    log_pk_cols = set(_get_pk_columns(tables["log"]))
    clean_log_updates = {
        k: v
        for k, v in (activity_log_updates or {}).items()
        if k in log_columns and k not in log_pk_cols and k != "USER_ID"
    }
    if clean_log_updates:
        update_table_row(tables["log"], log_pk, clean_log_updates)

    if ao_id is not None:
        out_pk = {"AO_ID": int(ao_id)}
        out_columns = _get_table_columns_set(tables["output"])
        out_pk_cols = set(_get_pk_columns(tables["output"]))
        clean_out_updates = {
            k: v
            for k, v in (activity_output_updates or {}).items()
            if k in out_columns and k not in out_pk_cols and k != "ACTI_LOG_ID"
        }
        if clean_out_updates:
            update_table_row(tables["output"], out_pk, clean_out_updates)

    if ao_id is not None:
        kit_table = tables["kit"]
        kit_columns = _get_table_columns_set(kit_table)
        kit_pk_cols = _get_pk_columns(kit_table)

        q = text(f"SELECT * FROM `{kit_table}` WHERE `AO_ID` = :ao_id")
        with engine.connect() as conn:
            existing_rows = conn.execute(q, {"ao_id": int(ao_id)}).mappings().all()

        def pk_key(pk_dict: dict) -> tuple:
            return tuple((k, pk_dict.get(k)) for k in kit_pk_cols)

        existing_map: dict[tuple, dict] = {}
        for row in existing_rows:
            row_dict = dict(row)
            existing_map[pk_key(_extract_pk_dict_from_row(kit_table, row_dict))] = row_dict

        incoming_map: dict[tuple, dict] = {}
        for raw_row in kit_rows or []:
            row = dict(raw_row)
            row["AO_ID"] = int(ao_id)
            pk_dict = {k: row.get(k) for k in kit_pk_cols if k in row}
            has_full_pk = len(pk_dict) == len(kit_pk_cols) and all(v is not None for v in pk_dict.values())
            if has_full_pk:
                incoming_map[pk_key(pk_dict)] = row
                clean_updates = {
                    k: v
                    for k, v in row.items()
                    if k in kit_columns and k not in kit_pk_cols and k != "AO_ID"
                }
                if clean_updates:
                    update_table_row(kit_table, pk_dict, clean_updates)
                continue
            clean_insert = {k: v for k, v in row.items() if k in kit_columns and k not in kit_pk_cols}
            insert_record(kit_table, clean_insert)

        for key, existing_row in existing_map.items():
            if key in incoming_map:
                continue
            delete_table_row(kit_table, _extract_pk_dict_from_row(kit_table, existing_row))

    return get_logging_history_detail(user_id, acti_log_id)


def delete_logging_session(*, user_id: int, acti_log_id: int) -> dict:
    tables = _resolve_history_tables()
    detail = get_logging_history_detail(user_id, acti_log_id)
    ao_id = detail["summary"].get("ao_id")

    with engine.begin() as conn:
        if ao_id is not None:
            conn.execute(
                text(f"DELETE FROM `{tables['kit']}` WHERE `AO_ID` = :ao_id"),
                {"ao_id": int(ao_id)},
            )
            conn.execute(
                text(f"DELETE FROM `{tables['output']}` WHERE `AO_ID` = :ao_id"),
                {"ao_id": int(ao_id)},
            )
        conn.execute(
            text(f"DELETE FROM `{tables['log']}` WHERE `ACTI_LOG_ID` = :acti_log_id AND `USER_ID` = :user_id"),
            {"acti_log_id": acti_log_id, "user_id": user_id},
        )

    return {"success": True}


def get_activity_ids(status: str = None) -> list:
    """Return a list of all ACTIVITY_IDs in the ACTIVITY table."""
    try:
        metadata = MetaData()
        metadata.reflect(bind=engine)
        table_map = {name.lower(): name for name in metadata.tables.keys()}
        resolved_name = table_map.get("activity")
        if not resolved_name:
            raise ValueError("ACTIVITY table not found (case-insensitive lookup).")

        activity = metadata.tables[resolved_name]
        stmt = select(activity.c.ACTIVITY_ID)
        if status:
            stmt = stmt.where(activity.c.ACT_STATUS == status)

        with engine.connect() as conn:
            rows = conn.execute(stmt).all()
            return [row[0] for row in rows]
    except Exception:
        raise


def insert_record(table_name: str, data: dict):
    """Insert a record into a table.

    Returns ``primary_key`` when the engine reports inserted keys or a single
    MySQL AUTO_INCREMENT column (via LAST_INSERT_ID) so clients can chain FKs
    without a separate SELECT.
    """
    resolved = resolve_browser_table_name(table_name)
    metadata = MetaData()
    metadata.reflect(bind=engine, only=[resolved])
    table = metadata.tables[resolved]
    pk_columns = list(table.primary_key.columns)

    pk_dict: dict[str, object] = {}
    with engine.begin() as conn:
        result = conn.execute(table.insert(), data)
        inserted = getattr(result, "inserted_primary_key", None)
        if inserted is not None:
            vals = tuple(inserted)
            for i, col in enumerate(pk_columns):
                if i < len(vals) and vals[i] is not None:
                    pk_dict[col.name] = vals[i]
        if not pk_dict and len(pk_columns) == 1:
            col0 = pk_columns[0]
            if getattr(col0, "autoincrement", False):
                rid = conn.execute(text("SELECT LAST_INSERT_ID() AS id")).scalar()
                if rid is not None:
                    pk_dict[col0.name] = int(rid)

    out: dict = {
        "success": True,
        "message": f"Record inserted into {resolved}",
    }
    if pk_dict:
        out["primary_key"] = pk_dict
    return out


TABLE_ROWS_MAX_LIMIT = 600
TABLE_ROWS_DEFAULT_LIMIT = 150
AUTH_SESSION_TTL_HOURS = int(os.getenv("AUTH_SESSION_TTL_HOURS", "72"))


def _table_browser_denylist() -> set[str]:
    raw = os.getenv("TABLE_BROWSER_DENYLIST", "")
    return {t.strip().lower() for t in raw.split(",") if t.strip()}


def resolve_browser_table_name(requested: str) -> str:
    """Resolve requested name to the real table name; reject unknown or denylisted tables."""
    names = get_table_names()
    lower_map = {n.lower(): n for n in names}
    key = requested.lower()
    if key not in lower_map:
        raise ValueError(f"Unknown table: {requested}")
    canonical = lower_map[key]
    deny = _table_browser_denylist()
    if canonical.lower() in deny:
        raise ValueError(f"Table is not browseable: {canonical}")
    return canonical


def _serialize_cell(value):
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (bytes, memoryview)):
        return None
    return value


def _row_mapping_to_dict(mapping) -> dict:
    return {k: _serialize_cell(v) for k, v in dict(mapping).items()}


def _get_pk_columns(table_name: str) -> list[str]:
    inspector = sa_inspect(engine)
    pk = inspector.get_pk_constraint(table_name).get("constrained_columns") or []
    return list(pk)


def list_table_rows(
    table_name: str,
    *,
    limit: int,
    offset: int,
    sort_by: str | None,
    sort_dir: str,
    filters: dict,
) -> dict:
    """Paginated rows with optional equality filters and single-column sort."""
    resolved = resolve_browser_table_name(table_name)
    if limit < 1 or limit > TABLE_ROWS_MAX_LIMIT:
        raise ValueError(f"limit must be between 1 and {TABLE_ROWS_MAX_LIMIT}")
    if offset < 0:
        raise ValueError("offset must be non-negative")
    if sort_dir not in ("asc", "desc"):
        raise ValueError("sort_dir must be asc or desc")

    metadata = MetaData()
    metadata.reflect(bind=engine, only=[resolved])
    table = metadata.tables[resolved]
    column_names = {c.name for c in table.columns}

    conditions = []
    for col_name, val in (filters or {}).items():
        if col_name not in column_names:
            raise ValueError(f"Unknown filter column: {col_name}")
        col = table.c[col_name]
        if val is None:
            conditions.append(col.is_(None))
        else:
            conditions.append(col == val)

    where_clause = and_(*conditions) if conditions else None

    count_stmt = select(func.count()).select_from(table)
    if where_clause is not None:
        count_stmt = count_stmt.where(where_clause)

    select_stmt = select(table)
    if where_clause is not None:
        select_stmt = select_stmt.where(where_clause)

    if sort_by:
        if sort_by not in column_names:
            raise ValueError(f"Unknown sort column: {sort_by}")
        order_col = table.c[sort_by]
        select_stmt = select_stmt.order_by(asc(order_col) if sort_dir == "asc" else desc(order_col))
    else:
        pk_cols = _get_pk_columns(resolved)
        order_parts = []
        for pk in pk_cols:
            if pk in table.c:
                oc = table.c[pk]
                order_parts.append(asc(oc) if sort_dir == "asc" else desc(oc))
        if order_parts:
            select_stmt = select_stmt.order_by(*order_parts)

    select_stmt = select_stmt.limit(limit).offset(offset)

    with engine.connect() as conn:
        total = conn.execute(count_stmt).scalar_one()
        result = conn.execute(select_stmt)
        rows = [_row_mapping_to_dict(row._mapping) for row in result]

    return {"rows": rows, "total": int(total)}


def update_table_row(table_name: str, primary_key: dict, updates: dict) -> dict:
    """Update non-PK columns for the row identified by composite primary key."""
    resolved = resolve_browser_table_name(table_name)
    if not updates:
        raise ValueError("updates must not be empty")

    metadata = MetaData()
    metadata.reflect(bind=engine, only=[resolved])
    table = metadata.tables[resolved]
    column_names = {c.name for c in table.columns}

    pk_columns = _get_pk_columns(resolved)
    if not pk_columns:
        raise ValueError("Table has no primary key; cannot update rows safely")

    for pk in pk_columns:
        if pk not in primary_key:
            raise ValueError(f"Missing primary key column in request: {pk}")

    pk_set = set(pk_columns)
    set_values = {}
    for col_name, val in updates.items():
        if col_name in pk_set:
            raise ValueError(f"Cannot update primary key column: {col_name}")
        if col_name not in column_names:
            raise ValueError(f"Unknown column in updates: {col_name}")
        set_values[col_name] = val

    if not set_values:
        raise ValueError("No valid columns to update")

    where_parts = [table.c[pk] == primary_key[pk] for pk in pk_columns]
    stmt = table.update().where(and_(*where_parts)).values(**set_values)

    with engine.begin() as conn:
        result = conn.execute(stmt)
        if result.rowcount == 0:
            raise ValueError("No row matched the given primary key")

    return {"success": True, "message": "Row updated"}


def delete_table_row(table_name: str, primary_key: dict) -> dict:
    """Delete the row identified by composite primary key."""
    resolved = resolve_browser_table_name(table_name)
    metadata = MetaData()
    metadata.reflect(bind=engine, only=[resolved])
    table = metadata.tables[resolved]

    pk_columns = _get_pk_columns(resolved)
    if not pk_columns:
        raise ValueError("Table has no primary key; cannot delete rows safely")

    for pk in pk_columns:
        if pk not in primary_key:
            raise ValueError(f"Missing primary key column in request: {pk}")

    where_parts = [table.c[pk] == primary_key[pk] for pk in pk_columns]
    stmt = table.delete().where(and_(*where_parts))

    with engine.begin() as conn:
        result = conn.execute(stmt)
        if result.rowcount == 0:
            raise ValueError("No row matched the given primary key")

    return {"success": True, "message": "Row deleted"}


def _hash_password(password: str, salt_b64: str | None = None) -> tuple[str, str]:
    salt = base64.b64decode(salt_b64) if salt_b64 else secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000, dklen=32)
    return base64.b64encode(salt).decode("utf-8"), base64.b64encode(digest).decode("utf-8")


def _verify_password(password: str, salt_b64: str, password_hash_b64: str) -> bool:
    _, candidate_hash = _hash_password(password, salt_b64=salt_b64)
    return hmac.compare_digest(candidate_hash, password_hash_b64)


def _hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def ensure_auth_tables() -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS `USER_AUTH` (
                    `USER_ID` INT NOT NULL PRIMARY KEY,
                    `USERNAME` VARCHAR(120) NOT NULL UNIQUE,
                    `EMAIL` VARCHAR(255) NOT NULL UNIQUE,
                    `PASSWORD_SALT` VARCHAR(255) NOT NULL,
                    `PASSWORD_HASH` VARCHAR(255) NOT NULL,
                    `CREATED_AT` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `UPDATED_AT` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP
                )
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS `AUTH_SESSION` (
                    `ID` CHAR(36) NOT NULL PRIMARY KEY,
                    `USER_ID` INT NOT NULL,
                    `TOKEN_HASH` CHAR(64) NOT NULL UNIQUE,
                    `EXPIRES_AT` TIMESTAMP NOT NULL,
                    `CREATED_AT` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    INDEX `idx_auth_session_user` (`USER_ID`),
                    INDEX `idx_auth_session_exp` (`EXPIRES_AT`)
                )
                """
            )
        )


def _next_user_id() -> int:
    with engine.connect() as conn:
        row = conn.execute(text("SELECT COALESCE(MAX(`USER_ID`), 0) AS n FROM `USERS`")).mappings().first()
    return int(row["n"]) + 1 if row else 1


def _create_user_row(
    *,
    user_id: int,
    fullname: str,
    birth: str,
    gender: str,
    major: str,
    user_location: str,
) -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO `USERS` (`USER_ID`, `FULLNAME`, `BIRTH`, `GENDER`, `MAJOR`, `USER_LOCATION`)
                VALUES (:user_id, :fullname, :birth, :gender, :major, :user_location)
                """
            ),
            {
                "user_id": user_id,
                "fullname": fullname,
                "birth": birth,
                "gender": gender,
                "major": major,
                "user_location": user_location,
            },
        )


def ensure_seed_user_account() -> None:
    ensure_auth_tables()
    seed_password = os.getenv("SEED_USER1_PASSWORD", "learningdb-owner-1")

    seed_username = os.getenv("SEED_USER1_USERNAME", "owner")
    seed_email = os.getenv("SEED_USER1_EMAIL", "owner@learningdb.local")
    with engine.connect() as conn:
        user_row = conn.execute(
            text("SELECT `USER_ID` FROM `USERS` WHERE `USER_ID` = 1")
        ).mappings().first()
    if not user_row:
        raise RuntimeError("Seed user_id=1 not found in USERS table; cannot auto-seed auth account.")

    salt, pw_hash = _hash_password(seed_password)
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO `USER_AUTH` (`USER_ID`, `USERNAME`, `EMAIL`, `PASSWORD_SALT`, `PASSWORD_HASH`)
                VALUES (1, :username, :email, :salt, :pw_hash)
                ON DUPLICATE KEY UPDATE
                    `USERNAME` = VALUES(`USERNAME`),
                    `EMAIL` = VALUES(`EMAIL`),
                    `PASSWORD_SALT` = VALUES(`PASSWORD_SALT`),
                    `PASSWORD_HASH` = VALUES(`PASSWORD_HASH`)
                """
            ),
            {
                "username": seed_username,
                "email": seed_email,
                "salt": salt,
                "pw_hash": pw_hash,
            },
        )


def get_auth_user_by_login(login: str) -> dict | None:
    ensure_auth_tables()
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT ua.`USER_ID`, ua.`USERNAME`, ua.`EMAIL`, ua.`PASSWORD_SALT`, ua.`PASSWORD_HASH`, u.`USER_LOCATION`
                FROM `USER_AUTH` ua
                LEFT JOIN `USERS` u ON u.`USER_ID` = ua.`USER_ID`
                WHERE ua.`USERNAME` = :login OR ua.`EMAIL` = :login
                LIMIT 1
                """
            ),
            {"login": login},
        ).mappings().first()
    if not row:
        return None
    return {
        "user_id": int(row["USER_ID"]),
        "username": str(row["USERNAME"]),
        "email": str(row["EMAIL"]),
        "password_salt": str(row["PASSWORD_SALT"]),
        "password_hash": str(row["PASSWORD_HASH"]),
        "user_location": str(row["USER_LOCATION"]) if row.get("USER_LOCATION") is not None else "Asia/Ho_Chi_Minh",
    }


def get_auth_user_by_id(user_id: int) -> dict | None:
    ensure_auth_tables()
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT ua.`USER_ID`, ua.`USERNAME`, ua.`EMAIL`, u.`USER_LOCATION`
                FROM `USER_AUTH` ua
                LEFT JOIN `USERS` u ON u.`USER_ID` = ua.`USER_ID`
                WHERE ua.`USER_ID` = :user_id
                LIMIT 1
                """
            ),
            {"user_id": user_id},
        ).mappings().first()
    if not row:
        return None
    return {
        "user_id": int(row["USER_ID"]),
        "username": str(row["USERNAME"]),
        "email": str(row["EMAIL"]),
        "user_location": str(row["USER_LOCATION"]) if row.get("USER_LOCATION") is not None else "Asia/Ho_Chi_Minh",
    }


def get_account_settings(user_id: int) -> dict | None:
    ensure_auth_tables()
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT
                    ua.`USER_ID`,
                    ua.`USERNAME`,
                    ua.`EMAIL`,
                    u.`FULLNAME`,
                    u.`BIRTH`,
                    u.`GENDER`,
                    u.`MAJOR`,
                    u.`USER_LOCATION`
                FROM `USER_AUTH` ua
                LEFT JOIN `USERS` u ON u.`USER_ID` = ua.`USER_ID`
                WHERE ua.`USER_ID` = :user_id
                LIMIT 1
                """
            ),
            {"user_id": user_id},
        ).mappings().first()
    if not row:
        return None
    return {
        "user_id": int(row["USER_ID"]),
        "username": str(row["USERNAME"]),
        "email": str(row["EMAIL"]),
        "fullname": str(row["FULLNAME"]) if row.get("FULLNAME") is not None else "",
        "birth": str(row["BIRTH"]) if row.get("BIRTH") is not None else "",
        "gender": str(row["GENDER"]) if row.get("GENDER") is not None else "other",
        "major": str(row["MAJOR"]) if row.get("MAJOR") is not None else "General",
        "user_location": str(row["USER_LOCATION"]) if row.get("USER_LOCATION") is not None else "Asia/Ho_Chi_Minh",
    }


def update_account_settings(
    *,
    user_id: int,
    username: str,
    email: str,
    fullname: str,
    birth: str,
    gender: str,
    major: str,
    user_location: str,
) -> dict:
    ensure_auth_tables()
    username_clean = username.strip()
    email_clean = email.strip().lower()
    if len(username_clean) < 3:
        raise ValueError("username must be at least 3 characters")
    if len(email_clean) < 5:
        raise ValueError("email is invalid")
    if gender not in {"male", "female", "other"}:
        raise ValueError("gender must be one of: male, female, other")

    with engine.connect() as conn:
        existing = conn.execute(
            text("SELECT 1 FROM `USER_AUTH` WHERE `USER_ID` = :user_id LIMIT 1"),
            {"user_id": user_id},
        ).first()
    if not existing:
        raise ValueError("Account not found")

    with engine.connect() as conn:
        dup = conn.execute(
            text(
                """
                SELECT 1
                FROM `USER_AUTH`
                WHERE (`USERNAME` = :username OR `EMAIL` = :email)
                  AND `USER_ID` <> :user_id
                LIMIT 1
                """
            ),
            {"username": username_clean, "email": email_clean, "user_id": user_id},
        ).first()
    if dup:
        raise ValueError("username or email already exists")

    with engine.begin() as conn:
        conn.execute(
            text(
                """
                UPDATE `USER_AUTH`
                SET `USERNAME` = :username, `EMAIL` = :email
                WHERE `USER_ID` = :user_id
                """
            ),
            {"username": username_clean, "email": email_clean, "user_id": user_id},
        )
        conn.execute(
            text(
                """
                UPDATE `USERS`
                SET
                    `FULLNAME` = :fullname,
                    `BIRTH` = :birth,
                    `GENDER` = :gender,
                    `MAJOR` = :major,
                    `USER_LOCATION` = :user_location
                WHERE `USER_ID` = :user_id
                """
            ),
            {
                "fullname": fullname[:100],
                "birth": birth[:10],
                "gender": gender,
                "major": major[:100],
                "user_location": user_location[:100],
                "user_id": user_id,
            },
        )

    updated = get_account_settings(user_id)
    if not updated:
        raise ValueError("Failed to update account settings")
    return updated


def change_account_password(*, user_id: int, current_password: str, new_password: str) -> None:
    ensure_auth_tables()
    if len(new_password) < 6:
        raise ValueError("new password must be at least 6 characters")

    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT `PASSWORD_SALT`, `PASSWORD_HASH`
                FROM `USER_AUTH`
                WHERE `USER_ID` = :user_id
                LIMIT 1
                """
            ),
            {"user_id": user_id},
        ).mappings().first()
    if not row:
        raise ValueError("Account not found")

    if not _verify_password(current_password, str(row["PASSWORD_SALT"]), str(row["PASSWORD_HASH"])):
        raise ValueError("current password is incorrect")

    salt, pw_hash = _hash_password(new_password)
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                UPDATE `USER_AUTH`
                SET `PASSWORD_SALT` = :salt, `PASSWORD_HASH` = :pw_hash
                WHERE `USER_ID` = :user_id
                """
            ),
            {"salt": salt, "pw_hash": pw_hash, "user_id": user_id},
        )


def register_auth_user(
    *,
    username: str,
    email: str,
    password: str,
    fullname: str | None = None,
    birth: str = "2000-01-01",
    gender: str = "other",
    major: str = "General",
    user_location: str = "Asia/Ho_Chi_Minh",
) -> dict:
    ensure_auth_tables()
    login = username.strip()
    mail = email.strip().lower()
    if not login:
        raise ValueError("username is required")
    if not mail:
        raise ValueError("email is required")
    if len(password) < 6:
        raise ValueError("password must be at least 6 characters")
    if gender not in {"male", "female", "other"}:
        raise ValueError("gender must be one of: male, female, other")

    with engine.connect() as conn:
        dup = conn.execute(
            text(
                """
                SELECT 1
                FROM `USER_AUTH`
                WHERE `USERNAME` = :username OR `EMAIL` = :email
                LIMIT 1
                """
            ),
            {"username": login, "email": mail},
        ).first()
    if dup:
        raise ValueError("username or email already exists")

    user_id = _next_user_id()
    _create_user_row(
        user_id=user_id,
        fullname=(fullname or login)[:100],
        birth=birth,
        gender=gender,
        major=major[:100],
        user_location=user_location[:100],
    )
    salt, pw_hash = _hash_password(password)
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO `USER_AUTH` (`USER_ID`, `USERNAME`, `EMAIL`, `PASSWORD_SALT`, `PASSWORD_HASH`)
                VALUES (:user_id, :username, :email, :salt, :pw_hash)
                """
            ),
            {
                "user_id": user_id,
                "username": login,
                "email": mail,
                "salt": salt,
                "pw_hash": pw_hash,
            },
        )
    created = get_auth_user_by_id(user_id)
    if not created:
        raise ValueError("failed to create user auth record")
    return created


def authenticate_user(login: str, password: str) -> dict | None:
    row = get_auth_user_by_login(login.strip())
    if not row:
        return None
    if not _verify_password(password, row["password_salt"], row["password_hash"]):
        return None
    return get_auth_user_by_id(int(row["user_id"]))


def create_auth_session(user_id: int, ttl_hours: int = AUTH_SESSION_TTL_HOURS) -> str:
    ensure_auth_tables()
    token = secrets.token_urlsafe(32)
    token_hash = _hash_session_token(token)
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO `AUTH_SESSION` (`ID`, `USER_ID`, `TOKEN_HASH`, `EXPIRES_AT`)
                VALUES (:id, :user_id, :token_hash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL :ttl HOUR))
                """
            ),
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "token_hash": token_hash,
                "ttl": ttl_hours,
            },
        )
    return token


def get_user_id_from_session_token(token: str) -> int | None:
    ensure_auth_tables()
    token_hash = _hash_session_token(token)
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT `USER_ID`
                FROM `AUTH_SESSION`
                WHERE `TOKEN_HASH` = :token_hash
                    AND `EXPIRES_AT` > UTC_TIMESTAMP()
                LIMIT 1
                """
            ),
            {"token_hash": token_hash},
        ).mappings().first()
    if not row:
        return None
    return int(row["USER_ID"])


def delete_auth_session(token: str) -> None:
    ensure_auth_tables()
    token_hash = _hash_session_token(token)
    with engine.begin() as conn:
        conn.execute(
            text("DELETE FROM `AUTH_SESSION` WHERE `TOKEN_HASH` = :token_hash"),
            {"token_hash": token_hash},
        )


def delete_expired_auth_sessions() -> None:
    ensure_auth_tables()
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM `AUTH_SESSION` WHERE `EXPIRES_AT` <= UTC_TIMESTAMP()"))


def ensure_chat_preference_table() -> None:
    """Create chat preference table if it does not exist."""
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS `USER_CHAT_PREFERENCE` (
                    `USER_ID` INT NOT NULL PRIMARY KEY,
                    `PROVIDER` VARCHAR(64) NOT NULL,
                    `MODEL` VARCHAR(128) NOT NULL,
                    `UPDATED_AT` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP
                )
                """
            )
        )


def get_user_profile(user_id: int) -> dict | None:
    """
    Return USER_ID and USER_LOCATION from USERS.

    USER_LOCATION is expected to be an IANA timezone id (e.g. Asia/Ho_Chi_Minh) for client display.
    """
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT `USER_ID`, `USER_LOCATION`
                FROM `USERS`
                WHERE `USER_ID` = :user_id
                """
            ),
            {"user_id": user_id},
        ).mappings().first()
    if not row:
        return None
    return {
        "user_id": int(row["USER_ID"]),
        "user_location": str(row["USER_LOCATION"]),
    }


def get_chat_preference(user_id: int) -> dict | None:
    """Return provider/model preference for a user."""
    ensure_chat_preference_table()
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT `USER_ID`, `PROVIDER`, `MODEL`, `UPDATED_AT`
                FROM `USER_CHAT_PREFERENCE`
                WHERE `USER_ID` = :user_id
                """
            ),
            {"user_id": user_id},
        ).mappings().first()
    if not row:
        return None
    updated_at = row.get("UPDATED_AT")
    return {
        "user_id": int(row["USER_ID"]),
        "provider": str(row["PROVIDER"]),
        "model": str(row["MODEL"]),
        "updated_at": updated_at.isoformat() if updated_at else None,
    }


def upsert_chat_preference(user_id: int, provider: str, model: str) -> dict:
    """Create or update chat preference for a user."""
    ensure_chat_preference_table()
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO `USER_CHAT_PREFERENCE` (`USER_ID`, `PROVIDER`, `MODEL`)
                VALUES (:user_id, :provider, :model)
                ON DUPLICATE KEY UPDATE
                    `PROVIDER` = VALUES(`PROVIDER`),
                    `MODEL` = VALUES(`MODEL`)
                """
            ),
            {"user_id": user_id, "provider": provider, "model": model},
        )
    preference = get_chat_preference(user_id)
    if not preference:
        raise ValueError("Failed to persist chat preference.")
    return preference


def _derive_conversation_title(title: str | None, first_user_message: str | None) -> str:
    if title and title.strip():
        return title.strip()[:120]
    if first_user_message and first_user_message.strip():
        return first_user_message.strip()[:120]
    return "New chat"


def ensure_chat_conversation_tables() -> None:
    """Create chat conversation and message tables if they do not exist."""
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS `CHAT_CONVERSATION` (
                    `ID` CHAR(36) NOT NULL PRIMARY KEY,
                    `USER_ID` INT NOT NULL,
                    `TITLE` VARCHAR(120) NOT NULL,
                    `PROVIDER` VARCHAR(64) NOT NULL,
                    `MODEL` VARCHAR(128) NOT NULL,
                    `CREATED_AT` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `UPDATED_AT` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
                    `LAST_MESSAGE_AT` TIMESTAMP NULL DEFAULT NULL,
                    INDEX `idx_chat_conversation_user` (`USER_ID`),
                    INDEX `idx_chat_conversation_last_message_at` (`LAST_MESSAGE_AT`)
                )
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS `CHAT_MESSAGE` (
                    `ID` CHAR(36) NOT NULL PRIMARY KEY,
                    `CONVERSATION_ID` CHAR(36) NOT NULL,
                    `USER_ID` INT NOT NULL,
                    `ROLE` ENUM('user', 'assistant') NOT NULL,
                    `CONTENT` TEXT NOT NULL,
                    `REQUEST_ID` VARCHAR(128) NULL,
                    `CREATED_AT` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `SEQ` INT UNSIGNED NULL DEFAULT NULL,
                    INDEX `idx_chat_message_conversation` (`CONVERSATION_ID`, `CREATED_AT`),
                    INDEX `idx_chat_message_conversation_seq` (`CONVERSATION_ID`, `SEQ`),
                    INDEX `idx_chat_message_user` (`USER_ID`)
                )
                """
            )
        )
    _ensure_conversation_deleted_at_column()
    _ensure_last_message_at_nullable()
    _ensure_message_seq_column()


def _ensure_message_seq_column() -> None:
    """Per-conversation sequence so message order is stable when CREATED_AT ties (same-second inserts)."""
    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    ALTER TABLE `CHAT_MESSAGE`
                    ADD COLUMN `SEQ` INT UNSIGNED NULL DEFAULT NULL
                    """
                )
            )
    except Exception:
        pass

    try:
        with engine.begin() as conn:
            cids = conn.execute(
                text(
                    """
                    SELECT DISTINCT `CONVERSATION_ID`
                    FROM `CHAT_MESSAGE`
                    WHERE `SEQ` IS NULL
                    """
                )
            ).scalars().all()
            for cid in cids:
                rows = conn.execute(
                    text(
                        """
                        SELECT `ID`
                        FROM `CHAT_MESSAGE`
                        WHERE `CONVERSATION_ID` = :cid
                        ORDER BY
                            `CREATED_AT` ASC,
                            CASE `ROLE`
                                WHEN 'user' THEN 0
                                WHEN 'assistant' THEN 1
                                ELSE 2
                            END ASC,
                            `ID` ASC
                        """
                    ),
                    {"cid": cid},
                ).fetchall()
                for idx, (mid,) in enumerate(rows):
                    conn.execute(
                        text(
                            """
                            UPDATE `CHAT_MESSAGE`
                            SET `SEQ` = :seq
                            WHERE `ID` = :mid
                            """
                        ),
                        {"seq": idx, "mid": mid},
                    )
    except Exception:
        pass


def _ensure_last_message_at_nullable() -> None:
    """Allow NULL LAST_MESSAGE_AT until the first message; backfill empty threads."""
    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    ALTER TABLE `CHAT_CONVERSATION`
                    MODIFY COLUMN `LAST_MESSAGE_AT` TIMESTAMP NULL DEFAULT NULL
                    """
                )
            )
    except Exception:
        pass

    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    UPDATE `CHAT_CONVERSATION` c
                    SET `LAST_MESSAGE_AT` = NULL
                    WHERE c.`DELETED_AT` IS NULL
                      AND NOT EXISTS (
                          SELECT 1 FROM `CHAT_MESSAGE` m
                          WHERE m.`CONVERSATION_ID` = c.`ID`
                      )
                    """
                )
            )
    except Exception:
        pass


def _ensure_conversation_deleted_at_column() -> None:
    """Add DELETED_AT for soft-delete on existing CHAT_CONVERSATION tables."""
    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    ALTER TABLE `CHAT_CONVERSATION`
                    ADD COLUMN `DELETED_AT` TIMESTAMP NULL DEFAULT NULL
                    """
                )
            )
    except Exception:
        # Column may already exist (duplicate column name).
        pass


def list_conversations(user_id: int) -> list[dict]:
    ensure_chat_conversation_tables()
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT
                    `ID`,
                    `USER_ID`,
                    `TITLE`,
                    `PROVIDER`,
                    `MODEL`,
                    `CREATED_AT`,
                    `UPDATED_AT`,
                    `LAST_MESSAGE_AT`
                FROM `CHAT_CONVERSATION`
                WHERE `USER_ID` = :user_id
                    AND `DELETED_AT` IS NULL
                ORDER BY COALESCE(`LAST_MESSAGE_AT`, `UPDATED_AT`) DESC, `UPDATED_AT` DESC
                """
            ),
            {"user_id": user_id},
        ).mappings().all()
    result: list[dict] = []
    for row in rows:
        result.append(
            {
                "id": str(row["ID"]),
                "user_id": int(row["USER_ID"]),
                "title": str(row["TITLE"]),
                "provider": str(row["PROVIDER"]),
                "model": str(row["MODEL"]),
                "created_at": row["CREATED_AT"].isoformat() if row["CREATED_AT"] else None,
                "updated_at": row["UPDATED_AT"].isoformat() if row["UPDATED_AT"] else None,
                "last_message_at": row["LAST_MESSAGE_AT"].isoformat()
                if row["LAST_MESSAGE_AT"]
                else None,
            }
        )
    return result


def create_conversation(
    user_id: int,
    title: str | None,
    provider: str | None,
    model: str | None,
    first_user_message: str | None = None,
) -> dict:
    ensure_chat_conversation_tables()
    conversation_id = str(uuid.uuid4())
    resolved_title = _derive_conversation_title(title, first_user_message)
    resolved_provider = (provider or "openai").strip().lower() or "openai"
    resolved_model = (model or "gpt-4.1-mini").strip() or "gpt-4.1-mini"
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO `CHAT_CONVERSATION`
                    (`ID`, `USER_ID`, `TITLE`, `PROVIDER`, `MODEL`, `LAST_MESSAGE_AT`)
                VALUES
                    (:id, :user_id, :title, :provider, :model, NULL)
                """
            ),
            {
                "id": conversation_id,
                "user_id": user_id,
                "title": resolved_title,
                "provider": resolved_provider,
                "model": resolved_model,
            },
        )
    conversations = list_conversations(user_id)
    created = next((item for item in conversations if item["id"] == conversation_id), None)
    if not created:
        raise ValueError("Failed to create conversation.")
    return created


def get_conversation(conversation_id: str, user_id: int) -> dict | None:
    ensure_chat_conversation_tables()
    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT
                    `ID`,
                    `USER_ID`,
                    `TITLE`,
                    `PROVIDER`,
                    `MODEL`,
                    `CREATED_AT`,
                    `UPDATED_AT`,
                    `LAST_MESSAGE_AT`
                FROM `CHAT_CONVERSATION`
                WHERE `ID` = :conversation_id AND `USER_ID` = :user_id
                    AND `DELETED_AT` IS NULL
                """
            ),
            {"conversation_id": conversation_id, "user_id": user_id},
        ).mappings().first()
    if not row:
        return None
    return {
        "id": str(row["ID"]),
        "user_id": int(row["USER_ID"]),
        "title": str(row["TITLE"]),
        "provider": str(row["PROVIDER"]),
        "model": str(row["MODEL"]),
        "created_at": row["CREATED_AT"].isoformat() if row["CREATED_AT"] else None,
        "updated_at": row["UPDATED_AT"].isoformat() if row["UPDATED_AT"] else None,
        "last_message_at": row["LAST_MESSAGE_AT"].isoformat()
        if row["LAST_MESSAGE_AT"]
        else None,
    }


def soft_delete_conversation(user_id: int, conversation_id: str) -> dict:
    """Soft-delete a conversation (sets DELETED_AT)."""
    ensure_chat_conversation_tables()
    with engine.begin() as conn:
        result = conn.execute(
            text(
                """
                UPDATE `CHAT_CONVERSATION`
                SET `DELETED_AT` = CURRENT_TIMESTAMP
                WHERE `ID` = :conversation_id
                    AND `USER_ID` = :user_id
                    AND `DELETED_AT` IS NULL
                """
            ),
            {"conversation_id": conversation_id, "user_id": user_id},
        )
        rowcount = getattr(result, "rowcount", None)
        if rowcount == 0:
            raise ValueError("Conversation not found or already deleted.")

    with engine.connect() as conn:
        row = conn.execute(
            text(
                """
                SELECT `DELETED_AT`
                FROM `CHAT_CONVERSATION`
                WHERE `ID` = :conversation_id AND `USER_ID` = :user_id
                """
            ),
            {"conversation_id": conversation_id, "user_id": user_id},
        ).mappings().first()
    deleted_at = row["DELETED_AT"] if row else None
    return {
        "id": conversation_id,
        "deleted_at": deleted_at.isoformat() if deleted_at else None,
    }


def list_conversation_messages(user_id: int, conversation_id: str) -> list[dict]:
    ensure_chat_conversation_tables()
    conversation = get_conversation(conversation_id, user_id)
    if not conversation:
        raise ValueError("Conversation not found.")
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                """
                SELECT
                    `ID`,
                    `CONVERSATION_ID`,
                    `USER_ID`,
                    `ROLE`,
                    `CONTENT`,
                    `REQUEST_ID`,
                    `CREATED_AT`
                FROM `CHAT_MESSAGE`
                WHERE `CONVERSATION_ID` = :conversation_id
                    AND `USER_ID` = :user_id
                ORDER BY
                    COALESCE(`SEQ`, 4294967295) ASC,
                    `CREATED_AT` ASC,
                    CASE `ROLE`
                        WHEN 'user' THEN 0
                        WHEN 'assistant' THEN 1
                        ELSE 2
                    END ASC
                """
            ),
            {"conversation_id": conversation_id, "user_id": user_id},
        ).mappings().all()
    return [
        {
            "id": str(row["ID"]),
            "conversation_id": str(row["CONVERSATION_ID"]),
            "user_id": int(row["USER_ID"]),
            "role": str(row["ROLE"]),
            "content": str(row["CONTENT"]),
            "request_id": row["REQUEST_ID"],
            "created_at": row["CREATED_AT"].isoformat() if row["CREATED_AT"] else None,
        }
        for row in rows
    ]


def append_conversation_message(
    user_id: int,
    conversation_id: str,
    role: str,
    content: str,
    request_id: str | None = None,
) -> dict:
    ensure_chat_conversation_tables()
    if role not in {"user", "assistant"}:
        raise ValueError("Invalid role. Expected 'user' or 'assistant'.")
    conversation = get_conversation(conversation_id, user_id)
    if not conversation:
        raise ValueError("Conversation not found.")

    message_id = str(uuid.uuid4())
    with engine.begin() as conn:
        row = conn.execute(
            text(
                """
                SELECT COALESCE(MAX(`SEQ`), -1) AS n
                FROM `CHAT_MESSAGE`
                WHERE `CONVERSATION_ID` = :conversation_id
                """
            ),
            {"conversation_id": conversation_id},
        ).mappings().first()
        next_seq = int(row["n"]) + 1
        conn.execute(
            text(
                """
                INSERT INTO `CHAT_MESSAGE`
                    (`ID`, `CONVERSATION_ID`, `USER_ID`, `ROLE`, `CONTENT`, `REQUEST_ID`, `SEQ`)
                VALUES
                    (:id, :conversation_id, :user_id, :role, :content, :request_id, :seq)
                """
            ),
            {
                "id": message_id,
                "conversation_id": conversation_id,
                "user_id": user_id,
                "role": role,
                "content": content,
                "request_id": request_id,
                "seq": next_seq,
            },
        )

        title = conversation["title"]
        if title == "New chat" and role == "user":
            title = _derive_conversation_title(None, content)
        conn.execute(
            text(
                """
                UPDATE `CHAT_CONVERSATION`
                SET
                    `TITLE` = :title,
                    `PROVIDER` = COALESCE(`PROVIDER`, :provider),
                    `MODEL` = COALESCE(`MODEL`, :model),
                    `LAST_MESSAGE_AT` = CURRENT_TIMESTAMP
                WHERE `ID` = :conversation_id AND `USER_ID` = :user_id
                """
            ),
            {
                "title": title,
                "provider": conversation["provider"],
                "model": conversation["model"],
                "conversation_id": conversation_id,
                "user_id": user_id,
            },
        )

    messages = list_conversation_messages(user_id, conversation_id)
    created = next((item for item in messages if item["id"] == message_id), None)
    if not created:
        raise ValueError("Failed to append conversation message.")
    return created
