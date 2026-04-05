from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import Student, Parent, User, Marks, Attendance, Activity, Announcement, ClassModel, PasswordResetRequest, Fees, FeeComponent
from ..core.security import get_password_hash
from datetime import date, datetime
from typing import Optional, List
import uuid

def get_dashboard_summary(db: Session, class_name: Optional[str] = None, section: Optional[str] = None):
    student_query = db.query(Student)
    parent_query = db.query(Parent)
    class_query = db.query(ClassModel)
    
    # Mapping for common class naming inconsistencies
    class_map = {"7": "VII", "VII": "7"}
    
    if class_name:
        if class_name in class_map:
            alt_class = class_map[class_name]
            student_query = student_query.filter(func.trim(Student.class_).in_([class_name, alt_class]))
            class_query = class_query.filter(func.trim(ClassModel.class_name).in_([class_name, alt_class]))
        else:
            student_query = student_query.filter(func.trim(Student.class_) == class_name)
            class_query = class_query.filter(func.trim(ClassModel.class_name) == class_name)
    
    if section:
        student_query = student_query.filter(func.trim(Student.section) == section)
        class_query = class_query.filter(func.trim(ClassModel.section) == section)
        
    if class_name or section:
        parent_query = parent_query.join(Student)
        if class_name:
            if class_name in class_map:
                parent_query = parent_query.filter(func.trim(Student.class_).in_([class_name, class_map[class_name]]))
            else:
                parent_query = parent_query.filter(func.trim(Student.class_) == class_name)
        if section:
            parent_query = parent_query.filter(func.trim(Student.section) == section)
    
    # Log counts for debugging
    student_count = student_query.count()
    parent_count = parent_query.distinct().count() if (class_name or section) else parent_query.count()
    
    # If filtered and no class found in ClassModel but students exist, set class count to 1
    total_classes = class_query.count()
    if (class_name or section) and total_classes == 0 and student_count > 0:
        total_classes = 1

    return {
        "total_students": student_count,
        "total_parents": parent_count,
        "total_classes": total_classes,
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

from fastapi import HTTPException, status

# Parent Management
def create_parent(db: Session, parent_data: dict):
    new_phone = parent_data.get("phone_primary")
    if new_phone:
        new_phone = new_phone.strip()
        parent_data["phone_primary"] = new_phone

    # Check if a user with this phone number already exists
    existing_user = db.query(User).filter(User.phone_number == new_phone).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Parent with phone number {new_phone} already exists."
        )
        
    # Check if another parent with this phone number exists
    existing_parent = db.query(Parent).filter(Parent.phone_primary == new_phone).first()
    if existing_parent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Phone number {new_phone} is already associated with another record."
        )

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

def update_parent(db: Session, parent_id: str, parent_data: dict):
    db_parent = db.query(Parent).filter(Parent.parent_id == parent_id).first()
    if not db_parent:
        raise HTTPException(status_code=404, detail="Parent not found")
        
    old_phone = db_parent.phone_primary
    new_phone = parent_data.get("phone_primary")
    
    # Strip whitespace if phone provided
    if new_phone:
        new_phone = new_phone.strip()
        parent_data["phone_primary"] = new_phone
    
    # Check collisions only if phone changed
    if new_phone and old_phone != new_phone:
        # Check in Users table
        existing_user = db.query(User).filter(User.phone_number == new_phone).first()
        if existing_user and existing_user.parent_id != parent_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Parent with phone number {new_phone} already exists."
            )
            
        # Check in Parents table
        existing_parent = db.query(Parent).filter(Parent.phone_primary == new_phone).first()
        if existing_parent and existing_parent.parent_id != parent_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Phone number {new_phone} is already used by another parent."
            )
            
        # Update user's login phone as well
        db_user = db.query(User).filter(User.parent_id == parent_id).first()
        if db_user:
            db_user.phone_number = new_phone
    
    # Update parent details
    for key, value in parent_data.items():
        if value is not None:
            setattr(db_parent, key, value)
            
    db.commit()
    db.refresh(db_parent)
    return db_parent

def get_parents(db: Session, skip: int = 0, limit: int = 100, class_name: Optional[str] = None, section: Optional[str] = None):
    query = db.query(Parent)
    if class_name or section:
        query = query.join(Student)
        if class_name:
            query = query.filter(Student.class_ == class_name)
        if section:
            query = query.filter(Student.section == section)
        query = query.distinct()
    return query.offset(skip).limit(limit).all()

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
            existing.marks_obtained = entry["marks"]
            existing.total_marks = 100.0
            existing.exam_date = date.today()
        else:
            db_mark = Marks(
                student_id=entry["student_id"],
                subject=subject_val,
                exam_type=exam_val,
                class_=class_val,
                section=section_val,
                marks_obtained=entry["marks"],
                total_marks=100.0,
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
def get_all_fees(db: Session, class_name: Optional[str] = None, section: Optional[str] = None):
    # Query students first to provide a base for the fee table
    student_query = db.query(Student)
    
    # Mapping for common class naming inconsistencies
    class_map = {"7": "VII", "VII": "7"}
    
    if class_name:
        if class_name in class_map:
            alt_class = class_map[class_name]
            student_query = student_query.filter(func.trim(Student.class_).in_([class_name, alt_class]))
        else:
            student_query = student_query.filter(func.trim(Student.class_) == class_name)
    
    if section:
        student_query = student_query.filter(func.trim(Student.section) == section)
        
    students = student_query.all()
    results = []
    
    for s in students:
        # Get components
        comps = db.query(FeeComponent).filter(FeeComponent.student_id == s.student_id).all()
        comp_map = {c.fee_type: c.amount for c in comps}
        total_fee = sum(comp_map.values())
        
        # Fallback to legacy Fees table if no components set yet
        if total_fee == 0:
            legacy_fees = db.query(Fees).filter(Fees.student_id == s.student_id).all()
            if legacy_fees:
                total_fee = sum(float(f.amount or 0) for f in legacy_fees)
                comp_map = {"Tuition": total_fee} # Assume it is tuition if legacy

        results.append({
            "student_id": s.student_id,
            "student_name": f"{s.first_name} {s.last_name}",
            "class": f"{s.class_}{s.section}",
            "tuition": comp_map.get("Tuition", 0),
            "books": comp_map.get("Books", 0),
            "transport": comp_map.get("Transport", 0),
            "total": total_fee
        })
            
    return results

def create_fee_components(db: Session, fee_data: dict):
    student_id = fee_data.get("student_id")
    academic_year = fee_data.get("academic_year", "2024-25")
    
    # First delete existing components for the student for the same academic year (optional, assuming full replace)
    db.query(FeeComponent).filter(
        FeeComponent.student_id == student_id,
        FeeComponent.academic_year == academic_year
    ).delete()
    
    components = []
    for comp in fee_data.get("fee_components", []):
        db_comp = FeeComponent(
            student_id=student_id,
            fee_type=comp["fee_type"],
            amount=comp["amount"],
            academic_year=academic_year
        )
        db.add(db_comp)
        components.append(db_comp)
        
    db.commit()
    return {"message": "Fee components updated successfully"}


