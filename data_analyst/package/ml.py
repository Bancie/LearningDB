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

def sleep_via_study(user_id, SLEEP_START_CATEGORY, SLEEP_END_CATEGORY, WAKE_FEELING_CATEGORY):
    query