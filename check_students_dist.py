from backend.app.core.database import SessionLocal
from backend.app.models import Student
from sqlalchemy import func

db = SessionLocal()
results = db.query(Student.class_, Student.section, func.count(Student.student_id)).group_by(Student.class_, Student.section).all()

for r in results:
    print(f"Class: {r[0]}, Section: {r[1]}, Count: {r[2]}")

db.close()
