import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        print("Successfully connected to the database!")
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"Existing tables: {tables}")
        for table in tables:
            columns = [col['name'] for col in inspector.get_columns(table)]
            print(f" - {table}: {columns}")
except Exception as e:
    print(f"Connection failed: {e}")
