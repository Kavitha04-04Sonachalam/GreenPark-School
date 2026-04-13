from sqlalchemy import create_engine, text
from app.core.config import settings
import sys

def list_databases():
    # Use the existing URL but connect to 'postgres' (the default maintenance DB) 
    # if it's not already, to query other DBs.
    base_url = settings.DATABASE_URL.split('/')[0] + "//" + settings.DATABASE_URL.split('//')[1].split('/')[0] + "/postgres?sslmode=require"
    
    engine = create_engine(base_url)
    
    try:
        with engine.connect() as conn:
            # Query pg_database to see all DBs
            result = conn.execute(text("SELECT datname FROM pg_database WHERE datistemplate = false;"))
            dbs = [row[0] for row in result]
            print("\nAvailable Databases on this RDS Instance:")
            for db_name in dbs:
                print(f" - {db_name}")
            
            print("\nCurrently using in .env: postgres")
            
    except Exception as e:
        print(f"Error listing databases: {e}")

if __name__ == "__main__":
    list_databases()
