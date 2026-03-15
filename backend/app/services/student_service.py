from sqlalchemy.orm import Session
from ..models.student import Student

def get_student_by_id(db: Session, student_id: int):
    return db.query(Student).get(student_id)
