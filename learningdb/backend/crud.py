"""
CRUD operations - ported from bayes.py
"""
import pandas as pd
import uuid
from sqlalchemy import text, select, func, Table, MetaData
try:
    from .database import engine
except ImportError:
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
                    `LAST_MESSAGE_AT` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
                    INDEX `idx_chat_message_conversation` (`CONVERSATION_ID`, `CREATED_AT`),
                    INDEX `idx_chat_message_user` (`USER_ID`)
                )
                """
            )
        )


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
                ORDER BY `LAST_MESSAGE_AT` DESC, `UPDATED_AT` DESC
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
                    (`ID`, `USER_ID`, `TITLE`, `PROVIDER`, `MODEL`)
                VALUES
                    (:id, :user_id, :title, :provider, :model)
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
                ORDER BY `CREATED_AT` ASC
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
        conn.execute(
            text(
                """
                INSERT INTO `CHAT_MESSAGE`
                    (`ID`, `CONVERSATION_ID`, `USER_ID`, `ROLE`, `CONTENT`, `REQUEST_ID`)
                VALUES
                    (:id, :conversation_id, :user_id, :role, :content, :request_id)
                """
            ),
            {
                "id": message_id,
                "conversation_id": conversation_id,
                "user_id": user_id,
                "role": role,
                "content": content,
                "request_id": request_id,
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
