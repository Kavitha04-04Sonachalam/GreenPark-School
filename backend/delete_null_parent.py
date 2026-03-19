import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv("c:/Users/kavit/Downloads/parent-portal-build/backend/.env")
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.begin() as conn:
    print("Deleting rows with NULL parent_id...")
    conn.execute(text("DELETE FROM parents WHERE parent_id IS NULL"))
    print("Deleted successfully!")
