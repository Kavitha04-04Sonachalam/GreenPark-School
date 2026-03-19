import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv("c:/Users/kavit/Downloads/parent-portal-build/backend/.env")
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No DB URL")
    exit(1)

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    res = conn.execute(text('SELECT * FROM parents')).fetchall()
    for i, r in enumerate(res):
        print(f"Row {i}: ID='{r.parent_id}' ({type(r.parent_id)}) Father='{r.father_name}' Phone='{r.phone_primary}'")
