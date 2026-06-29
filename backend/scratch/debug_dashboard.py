import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.services import admin_service

db = SessionLocal()
try:
    print("Calling get_dashboard_summary...")
    summary = admin_service.get_dashboard_summary(db)
    print("Dashboard Summary:", summary)
except Exception as e:
    print("Error calling get_dashboard_summary:", e)
finally:
    db.close()
