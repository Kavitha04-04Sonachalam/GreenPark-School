from sqlalchemy.orm import Session
from ..models.student import Student

def get_students_for_parent(db: Session, parent_id: str):
    return db.query(Student).filter(Student.parent_id == parent_id).all()
