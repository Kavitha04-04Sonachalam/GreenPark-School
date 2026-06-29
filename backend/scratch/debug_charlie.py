import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.core.database import SessionLocal, engine

db = SessionLocal()
try:
    res = db.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'students'")).all()
    print("COLUMNS ON students:")
    for r in res:
        print(f" - {r[0]} ({r[1]})")
finally:
    db.close()
