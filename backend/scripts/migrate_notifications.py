import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path='c:/Users/kavit/Downloads/parent-portal-build/backend/.env')

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    if not DATABASE_URL:
        print("DATABASE_URL not found")
        return

    engine = create_engine(DATABASE_URL)
    
    queries = [
        "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50);",
        "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS reference_id INTEGER;",
        "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read INTEGER DEFAULT 0;",
        # Also update target_type comment or logic if needed, but not strictly required
    ]
    
    with engine.connect() as conn:
        for query in queries:
            try:
                conn.execute(text(query))
                conn.commit()
                print(f"Executed: {query}")
            except Exception as e:
                print(f"Error executing {query}: {e}")

if __name__ == "__main__":
    migrate()
