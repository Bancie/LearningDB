"""
CRUD operations - ported from bayes.py
"""
import os
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
    """Insert a record into a table."""
    metadata = MetaData()
    metadata.reflect(bind=engine, only=[table_name])
    table = metadata.tables[table_name]
    
    with engine.begin() as conn:
        conn.execute(table.insert(), data)
    
    return {"success": True, "message": f"Record inserted into {table_name}"}


TABLE_ROWS_MAX_LIMIT = 200
TABLE_ROWS_DEFAULT_LIMIT = 50


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
