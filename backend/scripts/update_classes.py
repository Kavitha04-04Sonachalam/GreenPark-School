from backend.app.core.database import SessionLocal
from backend.app.models import Student

db = SessionLocal()
count = db.query(Student).filter(Student.class_ == 'VII').update({"class_": "7"}, synchronize_session=False)
db.commit()
print(f"Updated {count} records")
db.close()
