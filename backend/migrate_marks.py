import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        print("Migrating marks table...")
        
        # Check if columns exist
        result = connection.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='marks'"))
        columns = [row[0] for row in result]
        print(f"Current columns: {columns}")
        
        # 1. Rename 'marks' to 'marks_obtained' if it exists and 'marks_obtained' doesn't
        if 'marks' in columns and 'marks_obtained' not in columns:
            print("Renaming 'marks' to 'marks_obtained'...")
            connection.execute(text("ALTER TABLE marks RENAME COLUMN marks TO marks_obtained"))
            connection.commit()
            print("Done.")
        
        # 2. Add 'total_marks' if it doesn't exist
        if 'total_marks' not in columns:
            print("Adding 'total_marks' column...")
            connection.execute(text("ALTER TABLE marks ADD COLUMN total_marks FLOAT DEFAULT 100.0"))
            connection.commit()
            print("Done.")
            
        print("Migration completed successfully!")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"Migration failed: {e}")
