from dotenv import load_dotenv
import os
from sqlalchemy import create_engine, text

load_dotenv()

user = os.getenv("DB_USER")
password = os.getenv("DB_PASS")
host = os.getenv("DB_HOST")
dbname = os.getenv("DB_NAME")

engine = create_engine(f"mysql+mysqlconnector://{user}:{password}@{host}/{dbname}", connect_args={'init_command': 'SET time_zone="+07:00"'})

def update_prior_prob(activity_id, prob):
    with engine.connect() as conn:
        conn.execute(
            text(f"""
                UPDATE `ACTIVITY`
                SET `PRIOR_PROB`= :p
                WHERE `ACTIVITY_ID`= :aid AND `ACT_STATUS`='in_progress'
            """),
            {"p": prob, "aid": activity_id}
        )
        conn.commit()

def update_posterior_prob(activity_id, column_choice, prob):
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