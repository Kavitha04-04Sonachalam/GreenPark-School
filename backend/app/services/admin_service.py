from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import Student, Parent, User, Marks, Attendance, Activity, Announcement, ClassModel, PasswordResetRequest, Fees
from ..core.security import get_password_hash
from datetime import date, datetime
from typing import Optional, List
import uuid

def get_dashboard_summary(db: Session):
    return {
        "total_students": db.query(Student).count(),
        "total_parents": db.query(Parent).count(),
        "total_classes": db.query(ClassModel).count(),
        "total_activities": db.query(Activity).count()
    }

# Student Management
def create_student(db: Session, student_data: dict):
    if not student_data.get("student_id"):
        student_data["student_id"] = str(uuid.uuid4())[:8].upper()
    
    db_student = Student(**student_data)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def get_students(db: Session, skip: int = 0, limit: int = 100, class_name: Optional[str] = None, section: Optional[str] = None):
    query = db.query(Student)
    if class_name:
        query = query.filter(Student.class_ == class_name)
    if section:
        query = query.filter(Student.section == section)
    return query.offset(skip).limit(limit).all()

def update_student(db: Session, student_id: str, student_data: dict):
    db_student = db.query(Student).filter(Student.student_id == student_id).first()
    if db_student:
        for key, value in student_data.items():
            setattr(db_student, key, value)
        db.commit()
        db.refresh(db_student)
    return db_student

def delete_student(db: Session, student_id: str):
    db_student = db.query(Student).filter(Student.student_id == student_id).first()
    if db_student:
        db.delete(db_student)
        db.commit()
    return db_student

# Parent Management
def create_parent(db: Session, parent_data: dict):
    if not parent_data.get("parent_id"):
        parent_id = str(uuid.uuid4())
        parent_data["parent_id"] = parent_id[:8].upper()
    
    db_parent = Parent(**parent_data)
    db.add(db_parent)
    
    # Create User account
    db_user = User(
        phone_number=parent_data["phone_primary"],
        password=get_password_hash("password123"),
        role="parent",
        parent_id=parent_data["parent_id"]
    )
    db.add(db_user)
    
    db.commit()
    db.refresh(db_parent)
    return db_parent

def get_parents(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Parent).offset(skip).limit(limit).all()

# Marks Management (Bulk)
def enter_bulk_marks(db: Session, marks_data: dict):
    class_val = marks_data["class_name"]
    section_val = marks_data["section"]
    exam_val = marks_data["exam_type"]
    subject_val = marks_data["subject"]
    
    for entry in marks_data["marks"]:
        existing = db.query(Marks).filter(
            Marks.student_id == entry["student_id"],
            Marks.subject == subject_val,
            Marks.exam_type == exam_val,
            Marks.class_ == class_val,
            Marks.section == section_val
        ).first()
        
        if existing:
            existing.marks = entry["marks"]
        else:
            db_mark = Marks(
                student_id=entry["student_id"],
                subject=subject_val,
                exam_type=exam_val,
                class_=class_val,
                section=section_val,
                marks=entry["marks"],
                exam_date=date.today(),
                academic_year="2024-25"
            )
            db.add(db_mark)
    db.commit()
    return {"message": "Marks updated successfully"}

# Attendance (Bulk)
def mark_bulk_attendance(db: Session, attendance_data: dict):
    date_val = attendance_data["date"]
    class_val = attendance_data["class_name"]
    section_val = attendance_data["section"]
    
    for entry in attendance_data["attendance"]:
        existing = db.query(Attendance).filter(
            Attendance.student_id == entry["student_id"],
            Attendance.date == date_val
        ).first()
        
        if existing:
            existing.status = entry["status"]
            existing.class_ = class_val
            existing.section = section_val
        else:
            db_attendance = Attendance(
                student_id=entry["student_id"],
                date=date_val,
                class_=class_val,
                section=section_val,
                status=entry["status"],
                academic_year="2024-25"
            )
            db.add(db_attendance)
    db.commit()
    return {"message": "Attendance marked successfully"}

# Activities
def get_activities(db: Session):
    return db.query(Activity).order_by(Activity.event_date.desc()).all()

def create_activity(db: Session, activity_data: dict):
    db_activity = Activity(**activity_data)
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity

def delete_activity(db: Session, activity_id: int):
    # Use Session.get() instead of query().get() for SQLAlchemy 2.0 compatibility
    db_activity = db.get(Activity, activity_id)
    if db_activity:
        db.delete(db_activity)
        db.commit()
    return db_activity

# Announcements
def get_announcements(db: Session):
    return db.query(Announcement).order_by(Announcement.created_at.desc()).all()

def create_announcement(db: Session, announcement_data: dict):
    db_announcement = Announcement(**announcement_data)
    db.add(db_announcement)
    db.commit()
    db.refresh(db_announcement)
    return db_announcement

# Password Resets
def get_password_reset_requests(db: Session):
    # Join with Parent to get name if possible
    results = db.query(PasswordResetRequest, Parent.father_name, Parent.mother_name)\
        .outerjoin(Parent, PasswordResetRequest.phone_number == Parent.phone_primary)\
        .order_by(PasswordResetRequest.request_time.desc()).all()
    
    formatted = []
    for req, f_name, m_name in results:
        data = {
            "id": req.id,
            "phone_number": req.phone_number,
            "request_time": req.request_time,
            "status": req.status,
            "parent_name": f"{f_name or ''} / {m_name or ''}".strip(" /") or "Unknown"
        }
        formatted.append(data)
    return formatted

def reset_parent_password(db: Session, phone_number: str):
    db_user = db.query(User).filter(User.phone_number == phone_number).first()
    if not db_user:
        return None
    
    # Reset to default
    db_user.password = get_password_hash("password123")
    
    # Mark associated requests as resolved
    db.query(PasswordResetRequest).filter(
        PasswordResetRequest.phone_number == phone_number,
        PasswordResetRequest.status == "pending"
    ).update({"status": "resolved"})
    
    db.commit()
    return db_user

# Fee Management
def get_all_fees(db: Session):
    return db.query(Fees).join(Student).all()
