import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, MetaData, inspect
from sqlalchemy.orm import sessionmaker

# Load environment variables from root .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"

engine = create_engine(
    DATABASE_URL,
    connect_args={'init_command': 'SET time_zone="+07:00"'},
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
metadata = MetaData()


def get_db():
    """Dependency to get DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_table_names():
    """Get all table names from the database"""
    try:
        inspector = inspect(engine)
        return inspector.get_table_names()
    except Exception as e:
        print(f"Error getting table names: {e}")
        return []


def get_table_columns(table_name: str):
    """Get column information for a specific table"""
    try:
        inspector = inspect(engine)
        columns = inspector.get_columns(table_name)
        pk_columns = inspector.get_pk_constraint(table_name).get('constrained_columns', [])
        
        result = []
        for col in columns:
            col_info = {
                'name': col['name'],
                'type': str(col['type']),
                'nullable': col.get('nullable', True),
                'is_primary_key': col['name'] in pk_columns,
                'autoincrement': col.get('autoincrement', False)
            }
            
            # Handle enum types
            if hasattr(col['type'], 'enums'):
                col_info['enums'] = col['type'].enums
            
            result.append(col_info)
        
        return result
    except Exception as e:
        print(f"Error getting columns for {table_name}: {e}")
        return []
