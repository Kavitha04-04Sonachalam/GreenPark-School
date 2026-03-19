from backend.app.core.database import SessionLocal
from backend.app.models import ClassModel

db = SessionLocal()
results = db.query(ClassModel).all()
for r in results:
    print(f"Class: {r.class_name}, Section: {r.section}")
db.close()
