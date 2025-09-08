from dotenv import load_dotenv
import os
from sqlalchemy import create_engine, text, select, func, Table, MetaData
import pandas as pd

load_dotenv()

user = os.getenv("DB_USER")
password = os.getenv("DB_PASS")
host = os.getenv("DB_HOST")
dbname = os.getenv("DB_NAME_SCHOOL")

engine = create_engine(f"mysql+mysqlconnector://{user}:{password}@{host}/{dbname}", connect_args={'init_command': 'SET time_zone="+07:00"'})

# def 