import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        print("Checking users table content...")
        result = connection.execute(text("SELECT user_id, phone_number, role, parent_id FROM users")).fetchall()
        for row in result:
            print(f"User: ID={row.user_id}, Phone={row.phone_number}, Role={row.role}, ParentID={row.parent_id}")
            
except Exception as e:
    print(f"Error: {e}")
