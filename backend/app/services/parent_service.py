from sqlalchemy.orm import Session
from ..models.parent import Parent
from ..models.student import Student

def get_students_for_parent(db: Session, parent_id: str):
    return db.query(Student).filter(Student.parent_id == parent_id).all()

def get_parent(db: Session, parent_id: str):
    return db.query(Parent).filter(Parent.parent_id == parent_id).first()

def update_profile_image(db: Session, parent_id: str, image_url: str):
    parent = db.query(Parent).filter(Parent.parent_id == parent_id).first()
    if parent:
        parent.profile_image_url = image_url
        db.commit()
        db.refresh(parent)
    return parent
