import os
from dotenv import load_dotenv
from sqlalchemy import text, create_engine

# Path to .env file
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL found.")
    exit(1)

engine = create_engine(DATABASE_URL)

with engine.begin() as conn:
    print("Adding profile_image_url column to parents table...")
    try:
        conn.execute(text("ALTER TABLE parents ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR;"))
        print("Done!")
    except Exception as e:
        print(f"Error: {e}")
