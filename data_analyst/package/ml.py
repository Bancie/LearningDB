from dotenv import load_dotenv
import os
from sqlalchemy import create_engine, text, select, func, Table, MetaData
import pandas as pd
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.tree import DecisionTreeClassifier, plot_tree
import matplotlib.pyplot as plt

load_dotenv()

user = os.getenv("DB_USER")
password = os.getenv("DB_PASS")
host = os.getenv("DB_HOST")
dbname = os.getenv("DB_NAME")

engine = create_engine(f"mysql+mysqlconnector://{user}:{password}@{host}/{dbname}", connect_args={'init_command': 'SET time_zone="+07:00"'})

def sleep_via_study(SLEEP_START_CATEGORY, SLEEP_END_CATEGORY, WAKE_FEELING_CATEGORY):
    query = text("""
                 SELECT * FROM ML_FOR_SLEEP
                 """)
    df = pd.read_sql(query, engine)

    combo_counts = df.groupby(
        [
            "SLEEP_START_CATEGORY",
            "SLEEP_END_CATEGORY",
            "WAKE_FEELING_CATEGORY",
            "MINUTES_PER_DAY_CATEGORY"
        ]
    ).size().reset_index(name="count")

    label_encoders = {}
    for col in ["SLEEP_START_CATEGORY", "SLEEP_END_CATEGORY", "WAKE_FEELING_CATEGORY", "MINUTES_PER_DAY_CATEGORY"]:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = le

    X = df[["SLEEP_START_CATEGORY", "SLEEP_END_CATEGORY", "WAKE_FEELING_CATEGORY"]]
    y = df["MINUTES_PER_DAY_CATEGORY"]

    clf = DecisionTreeClassifier(
        criterion="entropy",
        max_depth=None,
        random_state=42
    )
    clf.fit(X, y)
    
    sample = pd.DataFrame([[SLEEP_START_CATEGORY, SLEEP_END_CATEGORY, WAKE_FEELING_CATEGORY]], columns=X.columns)
    for col in sample.columns:
        sample[col] = label_encoders[col].transform(sample[col])

    pred = clf.predict(sample)
    
    return label_encoders["MINUTES_PER_DAY_CATEGORY"].inverse_transform(pred)[0]