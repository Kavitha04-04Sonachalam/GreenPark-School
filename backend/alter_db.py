import os
from dotenv import load_dotenv
from sqlalchemy import text, create_engine

load_dotenv("c:/Users/kavit/Downloads/parent-portal-build/backend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL found.")
    exit(1)

engine = create_engine(DATABASE_URL)

with engine.begin() as conn:
    print("Altering parents table...")
    conn.execute(text("ALTER TABLE parents ALTER COLUMN phone_primary TYPE VARCHAR USING phone_primary::VARCHAR;"))
    print("Altering users table...")
    conn.execute(text("ALTER TABLE users ALTER COLUMN phone_number TYPE VARCHAR USING phone_number::VARCHAR;"))
    print("Done!")
