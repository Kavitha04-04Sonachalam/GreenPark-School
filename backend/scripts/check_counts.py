from app.core.database import SessionLocal, engine
from sqlalchemy import text
import sys

def check_db_contents():
    db = SessionLocal()
    try:
        print(f"Connecting to: {engine.url.render_as_string(hide_password=True)}")
        
        # 1. List all tables in public schema
        print("\nAll Tables in Public Schema:")
        tables_result = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")).all()
        found_tables = [row[0] for row in tables_result]
        for t in found_tables:
            print(f" - {t}")
            
        print("\nRow Counts for Identified Tables:")
        # 2. Check counts for the common app tables
        target_tables = ["parents", "users", "students", "marks", "attendance", "fee_components"]
        for table in target_tables:
            if table in found_tables:
                result = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                print(f"Table '{table}': {result} rows")
            else:
                print(f"Table '{table}': Missing")
                
    except Exception as e:
        print(f"Connection Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_db_contents()
