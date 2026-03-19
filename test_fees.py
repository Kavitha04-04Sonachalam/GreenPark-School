from backend.app.core.database import SessionLocal
from backend.app.models import Fees, Student
from sqlalchemy import func
from typing import Optional

def get_all_fees(db: SessionLocal, class_name: Optional[str] = None, section: Optional[str] = None):
    query = db.query(Fees).join(Student)
    
    if class_name:
        query = query.filter(func.trim(Student.class_) == class_name)
    
    if section:
        query = query.filter(func.trim(Student.section) == section)
        
    return query.all()

db = SessionLocal()
results = get_all_fees(db, "7", "A")
print(f"Count: {len(results)}")
for r in results[:5]:
    print(f"Fee ID: {r.fee_id}, Student ID: {r.student_id}, Class: {r.student.class_}")
db.close()
