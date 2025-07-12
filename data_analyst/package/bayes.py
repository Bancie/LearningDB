from dotenv import load_dotenv
import os
from sqlalchemy import create_engine, text, select, func, Table, MetaData
import pandas as pd

load_dotenv()

user = os.getenv("DB_USER")
password = os.getenv("DB_PASS")
host = os.getenv("DB_HOST")
dbname = os.getenv("DB_NAME")

engine = create_engine(f"mysql+mysqlconnector://{user}:{password}@{host}/{dbname}", connect_args={'init_command': 'SET time_zone="+07:00"'})

def update_prior_prob(activity_id, prob):
    """
    Update the prior probability for a specific activity.
    """
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
    """"
    Update the posterior probability for a specific activity and column choice.
    """
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
    """
    Set all prior and posterior probabilities to zero for activities not in progress.
    """
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

def check_prior():
    """
    Check if the sum of prior probabilities equals 1.0.
    If not, print an error message with the total.
    """
    metadata = MetaData()
    metadata.reflect(bind=engine)
    activity = metadata.tables['ACTIVITY']

    stmt = select(func.sum(activity.c.PRIOR_PROB))

    with engine.connect() as conn:
        total = conn.execute(stmt).scalar()

    if round(total or 0, 4) == 1.0:
        print("OK")
    else:
        print("Error! Sum =", total)

def run_bayes(total_minute=None):
    """
    Run the Bayesian analysis to calculate the probabilities for each activity.
    Returns a DataFrame with the results.
    If total_minute is provided, it scales the probabilities accordingly.
    If total_minute is None, it defaults to a scale of 1.
    """
    query = text("""
        SELECT ACT_NAME, PRIOR_PROB, 
               POSTERIOR_PROB_LEARNING, 
               POSTERIOR_PROB_OVERVIEW, 
               POSTERIOR_PROB_PRACTICE
        FROM bayes_act
    """)

    with engine.connect() as conn:
        df = pd.read_sql(query, conn)

    df['PRIOR_PROB'] = df['PRIOR_PROB'] / df['PRIOR_PROB'].sum()

    posterior_cols = ['POSTERIOR_PROB_LEARNING', 'POSTERIOR_PROB_OVERVIEW', 'POSTERIOR_PROB_PRACTICE']
    row_sum = df[posterior_cols].sum(axis=1).replace(0, 1)
    df['Learn_ratio'] = df['POSTERIOR_PROB_LEARNING'] / row_sum
    df['Overview_ratio'] = df['POSTERIOR_PROB_OVERVIEW'] / row_sum
    df['Practice_ratio'] = df['POSTERIOR_PROB_PRACTICE'] / row_sum

    scale = total_minute if total_minute is not None else 1
    result = pd.DataFrame()
    result['ACT_NAME'] = df['ACT_NAME']
    result['Learning'] = df['PRIOR_PROB'] * df['Learn_ratio'] * scale
    result['Overview'] = df['PRIOR_PROB'] * df['Overview_ratio'] * scale
    result['Practice'] = df['PRIOR_PROB'] * df['Practice_ratio'] * scale

    return result