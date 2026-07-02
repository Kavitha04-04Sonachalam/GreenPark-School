from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import Student, Parent, User, Marks, Attendance, Activity, Announcement, ClassModel, PasswordResetRequest, Fees, StudentEnrollment, AcademicYear, PromotionAuditLog, FeeStructure
from ..core.security import get_password_hash
from datetime import date, datetime
from typing import Optional, List
from fastapi import HTTPException
import uuid

def get_dashboard_summary(db: Session, class_name: Optional[str] = None, section: Optional[str] = None, academic_year_id: Optional[int] = None):
    student_query = db.query(Student)
    parent_query = db.query(Parent)
    class_query = db.query(ClassModel)
    
    # Get academic year name if academic_year_id is provided
    ay_name = None
    if academic_year_id:
        ay = db.query(AcademicYear).filter(AcademicYear.year_id == academic_year_id).first()
        if ay:
            ay_name = ay.year_name
            
    # Mapping for common class naming inconsistencies
    class_map = {"7": "VII", "VII": "7"}
    
    if academic_year_id:
        # Join with StudentEnrollment to filter by academic year and only get Active enrollments
        student_query = student_query.join(StudentEnrollment, Student.student_id == StudentEnrollment.student_id).filter(
            StudentEnrollment.academic_year_id == academic_year_id,
            StudentEnrollment.status == "Active"
        )
        if class_name:
            if class_name in class_map:
                alt_class = class_map[class_name]
                student_query = student_query.filter(StudentEnrollment.school_class.in_([class_name, alt_class]))
            else:
                student_query = student_query.filter(StudentEnrollment.school_class == class_name)
        if section:
            student_query = student_query.filter(StudentEnrollment.section == section)
            
        # Parent filtering
        parent_query = parent_query.join(Student).join(StudentEnrollment, Student.student_id == StudentEnrollment.student_id).filter(
            StudentEnrollment.academic_year_id == academic_year_id,
            StudentEnrollment.status == "Active"
        )
        if class_name:
            if class_name in class_map:
                parent_query = parent_query.filter(StudentEnrollment.school_class.in_([class_name, class_map[class_name]]))
            else:
                parent_query = parent_query.filter(StudentEnrollment.school_class == class_name)
        if section:
            parent_query = parent_query.filter(StudentEnrollment.section == section)
    else:
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
    
    if ay_name:
        class_query = class_query.filter(ClassModel.academic_year == ay_name)

    # Log counts for debugging
    student_count = student_query.count()
    parent_count = parent_query.distinct().count() if (class_name or section or academic_year_id) else parent_query.count()
    
    # If filtered and no class found in ClassModel but students exist, set class count to 1
    total_classes = class_query.count()
    if (class_name or section) and total_classes == 0 and student_count > 0:
        total_classes = 1

    student_ids_query = student_query.with_entities(Student.student_id)
    student_ids = [s[0] for s in student_ids_query.all()]

    today_fees = 0.0
    month_fees = 0.0
    pending_total = 0.0

    if student_ids:
        from ..models.fee_payment import FeePayment
        from .fees_service import get_legacy_student_fee_summary as get_student_fee_summary

        today_start = datetime.utcnow().date()
        month_start = date(today_start.year, today_start.month, 1)

        # today's collections
        today_pay_query = db.query(func.sum(FeePayment.amount_paid)).filter(
            FeePayment.student_id.in_(student_ids),
            func.date(FeePayment.payment_date) == today_start
        ).scalar()
        today_fees = float(today_pay_query or 0.0)

        # month's collections
        month_pay_query = db.query(func.sum(FeePayment.amount_paid)).filter(
            FeePayment.student_id.in_(student_ids),
            func.date(FeePayment.payment_date) >= month_start
        ).scalar()
        month_fees = float(month_pay_query or 0.0)

        # Optimized pending balance calculation
        from decimal import Decimal
        
        # Ensure academic_year_id is resolved to do the correct calculation
        resolved_ay_id = academic_year_id
        if not resolved_ay_id:
            active_ay = db.query(AcademicYear).filter(AcademicYear.status == "ACTIVE").first()
            if active_ay:
                resolved_ay_id = active_ay.year_id
            else:
                first_ay = db.query(AcademicYear).order_by(AcademicYear.start_date.desc()).first()
                if first_ay:
                    resolved_ay_id = first_ay.year_id

        if resolved_ay_id:
            # 1. Get count of students grouped by class
            class_student_counts = db.query(
                StudentEnrollment.school_class,
                func.count(StudentEnrollment.student_id)
            ).filter(
                StudentEnrollment.student_id.in_(student_ids),
                StudentEnrollment.academic_year_id == resolved_ay_id
            ).group_by(StudentEnrollment.school_class).all()
            
            total_fees_assigned = Decimal(0)
            for school_class, count in class_student_counts:
                # 2. Get sum of fee structures configured for this class and year
                class_struct_sum = db.query(func.sum(FeeStructure.amount)).filter(
                    FeeStructure.academic_year_id == resolved_ay_id,
                    FeeStructure.school_class == school_class
                ).scalar() or Decimal(0)
                
                total_fees_assigned += Decimal(class_struct_sum) * count
                
            # 3. Get total paid by all matching students in this academic year
            total_paid_all = db.query(func.sum(FeePayment.amount_paid)).join(
                FeeStructure, FeePayment.fee_structure_id == FeeStructure.id
            ).filter(
                FeePayment.student_id.in_(student_ids),
                FeeStructure.academic_year_id == resolved_ay_id
            ).scalar() or Decimal(0)
            
            pending_total = float(max(total_fees_assigned - Decimal(total_paid_all), Decimal(0)))

    return {
        "total_students": student_count,
        "total_parents": parent_count,
        "total_classes": total_classes,
        "total_activities": db.query(Activity).count(),
        "today_fees_collected": today_fees,
        "month_fees_collected": month_fees,
        "pending_fees_total": pending_total
    }


# Student Management
def create_student(db: Session, student_data: dict):
    if not student_data.get("student_id"):
        student_data["student_id"] = str(uuid.uuid4())[:8].upper()
    
    db_student = Student(**student_data)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    
    # Create matching StudentEnrollment record
    try:
        ay_id = None
        if db_student.academic_year:
            target_ay = db.query(AcademicYear).filter(AcademicYear.year_name == db_student.academic_year).first()
            if target_ay:
                ay_id = target_ay.year_id
                
        if not ay_id:
            active_ay = db.query(AcademicYear).filter(AcademicYear.status == "ACTIVE").first()
            if not active_ay:
                active_ay = db.query(AcademicYear).first()
            if active_ay:
                ay_id = active_ay.year_id
                
        if ay_id:
            enrollment = StudentEnrollment(
                student_id=db_student.student_id,
                academic_year_id=ay_id,
                school_class=db_student.class_ or "LKG",
                section=db_student.section or "A",
                roll_number=db_student.roll_number,
                status="Active"
            )
            db.add(enrollment)
            db.commit()
    except Exception as e:
        print(f"Error creating student enrollment record: {e}")
        
    # Try auto-assigning fee structure
    try:
        from .fees_service import get_legacy_student_fee_summary as get_student_fee_summary
        get_student_fee_summary(db, db_student.student_id)
    except Exception as e:
        print(f"Error auto-assigning fee structure on create: {e}")
        
    return db_student

def get_students(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    class_name: Optional[str] = None, 
    section: Optional[str] = None,
    academic_year_id: Optional[int] = None,
    search: Optional[str] = None
):
    from sqlalchemy import or_
    
    # Resolve academic_year_id if not provided
    if not academic_year_id:
        active_ay = db.query(AcademicYear).filter(AcademicYear.status == "ACTIVE").first()
        if active_ay:
            academic_year_id = active_ay.year_id
        else:
            first_ay = db.query(AcademicYear).order_by(AcademicYear.start_date.desc()).first()
            if first_ay:
                academic_year_id = first_ay.year_id

    # Join Student and StudentEnrollment
    query = db.query(Student, StudentEnrollment, AcademicYear.year_name).join(
        StudentEnrollment, Student.student_id == StudentEnrollment.student_id
    ).join(
        AcademicYear, StudentEnrollment.academic_year_id == AcademicYear.year_id
    )

    if academic_year_id is not None:
        query = query.filter(StudentEnrollment.academic_year_id == academic_year_id)
    if class_name:
        query = query.filter(StudentEnrollment.school_class == class_name)
    if section:
        query = query.filter(StudentEnrollment.section == section)
        
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Student.first_name.ilike(search_term),
                Student.last_name.ilike(search_term),
                Student.student_id.ilike(search_term),
                Student.parent_id.ilike(search_term)
            )
        )

    results = query.order_by(StudentEnrollment.roll_number.asc()).offset(skip).limit(limit).all()

    class StudentRecord:
        def __init__(self, s, enr, y_name):
            self.student_id = s.student_id
            self.first_name = s.first_name
            self.last_name = s.last_name
            self.gender = s.gender
            self.date_of_birth = s.date_of_birth
            self.class_ = enr.school_class
            self.section = enr.section
            self.roll_number = enr.roll_number or ""
            self.academic_year = y_name
            self.admission_number = s.admission_number
            self.parent_id = s.parent_id

    return [StudentRecord(s, enrollment, year_name) for s, enrollment, year_name in results]

def update_student(db: Session, student_id: str, student_data: dict):
    db_student = db.query(Student).filter(Student.student_id == student_id).first()
    if db_student:
        old_class = db_student.class_
        for key, value in student_data.items():
            setattr(db_student, key, value)
        db.commit()
        db.refresh(db_student)
        
        # Update or create active enrollment record
        try:
            ay_id = None
            if db_student.academic_year:
                target_ay = db.query(AcademicYear).filter(AcademicYear.year_name == db_student.academic_year).first()
                if target_ay:
                    ay_id = target_ay.year_id
                    
            if not ay_id:
                active_ay = db.query(AcademicYear).filter(AcademicYear.status == "ACTIVE").first()
                if not active_ay:
                    active_ay = db.query(AcademicYear).first()
                if active_ay:
                    ay_id = active_ay.year_id
                    
            if ay_id:
                enrollment = db.query(StudentEnrollment).filter_by(
                    student_id=db_student.student_id,
                    academic_year_id=ay_id
                ).first()
                
                if not enrollment:
                    active_enr = db.query(StudentEnrollment).filter_by(
                        student_id=db_student.student_id,
                        status="Active"
                    ).first()
                    if active_enr:
                        active_enr.academic_year_id = ay_id
                        active_enr.school_class = db_student.class_ or "LKG"
                        active_enr.section = db_student.section or "A"
                        active_enr.roll_number = db_student.roll_number
                    else:
                        enrollment = StudentEnrollment(
                            student_id=db_student.student_id,
                            academic_year_id=ay_id,
                            school_class=db_student.class_ or "LKG",
                            section=db_student.section or "A",
                            roll_number=db_student.roll_number,
                            status="Active"
                        )
                        db.add(enrollment)
                else:
                    enrollment.school_class = db_student.class_ or "LKG"
                    enrollment.section = db_student.section or "A"
                    enrollment.roll_number = db_student.roll_number
                    enrollment.status = "Active"
                db.commit()
        except Exception as e:
            print(f"Error synchronizing student enrollment record: {e}")
        
        # If class or academic year changed, trigger re-assignment
        if ("class_" in student_data and student_data["class_"] != old_class) or "academic_year" in student_data:
            try:
                from .fees_service import get_legacy_student_fee_summary as get_student_fee_summary
                get_student_fee_summary(db, db_student.student_id, ay_id)
            except Exception as e:
                print(f"Error re-assigning fee structure on update: {e}")
    return db_student

def promote_student(db: Session, student_id: str, target_academic_year_id: int, target_class: str, target_section: str):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Mark previous active enrollment records as Promoted
    current_actives = db.query(StudentEnrollment).filter(
        StudentEnrollment.student_id == student_id,
        StudentEnrollment.status == "Active"
    ).all()
    
    for enrollment in current_actives:
        enrollment.status = "Promoted"
        
    # Create new Active enrollment for target year
    new_enrollment = StudentEnrollment(
        student_id=student_id,
        academic_year_id=target_academic_year_id,
        school_class=target_class,
        section=target_section,
        roll_number=student.roll_number,
        status="Active",
        promoted_date=datetime.now()
    )
    if current_actives:
        new_enrollment.promoted_from_enrollment_id = current_actives[-1].id
        
    db.add(new_enrollment)
    db.commit()
    db.refresh(new_enrollment)
    
    # Sync target class & section back to Student table for backward compatibility
    student.class_ = target_class
    student.section = target_section
    
    db.commit()
    db.refresh(student)
    
    # Auto-assign fee structure for the new year/class
    try:
        from .fees_service import get_legacy_student_fee_summary as get_student_fee_summary
        get_student_fee_summary(db, student_id)
    except Exception as e:
        print(f"Error auto-assigning fee structure on promotion: {e}")
        
    return student

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


# Promotion Management Services
def get_students_promotion_status(
    db: Session,
    current_academic_year_id: int,
    target_academic_year_id: int,
    class_name: str,
    section: Optional[str] = None
):
    # Query all students with enrollment in current academic year & class
    query = db.query(Student, StudentEnrollment).join(
        StudentEnrollment, Student.student_id == StudentEnrollment.student_id
    ).filter(
        StudentEnrollment.academic_year_id == current_academic_year_id,
        StudentEnrollment.school_class == class_name
    )
    
    if section:
        query = query.filter(StudentEnrollment.section == section)
        
    results = query.all()
    
    status_list = []
    for student, current_enrollment in results:
        # Check target academic year enrollment for this student
        target_enrollment = db.query(StudentEnrollment).filter_by(
            student_id=student.student_id,
            academic_year_id=target_academic_year_id
        ).first()
        
        already_promoted = target_enrollment is not None
        
        status_list.append({
            "student_id": student.student_id,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "roll_number": current_enrollment.roll_number or student.roll_number,
            "current_class": current_enrollment.school_class,
            "current_section": current_enrollment.section,
            "already_promoted": already_promoted,
            "promoted_to_class": target_enrollment.school_class if already_promoted else None,
            "promoted_to_section": target_enrollment.section if already_promoted else None,
            "promotion_status": target_enrollment.status if already_promoted else None
        })
        
    return status_list


def promote_students_bulk(
    db: Session,
    student_ids: List[str],
    target_academic_year_id: int,
    target_class: str,
    target_section: str,
    promoted_by: str
):
    results = []
    success_count = 0
    failed_count = 0

    # 1. Resolve Target Academic Year
    target_ay = db.query(AcademicYear).filter(AcademicYear.year_id == target_academic_year_id).first()
    if not target_ay:
        raise HTTPException(status_code=404, detail="Target Academic Year not found")

    # 2. Check Fee Structure if target class is not a graduation class
    is_graduation = target_class.lower() in ["completed", "alumni", "graduated"]
    if not is_graduation:
        # Check if fee structures exist for the target class/academic year
        fee_struct_exists = db.query(FeeStructure).filter_by(
            academic_year_id=target_academic_year_id,
            school_class=target_class
        ).first()
        if not fee_struct_exists:
            raise HTTPException(
                status_code=400,
                detail=f"Fee structures for Class {target_class} in Academic Year {target_ay.year_name} are not configured. Please configure them first."
            )

    for student_id in student_ids:
        student = db.query(Student).filter(Student.student_id == student_id).first()
        if not student:
            failed_count += 1
            results.append({
                "student_id": student_id,
                "student_name": "Unknown",
                "status": "Failed",
                "error_message": "Student not found"
            })
            continue

        student_name = f"{student.first_name} {student.last_name}"
        previous_class = student.class_
        previous_section = student.section
        current_ay_id = None

        try:
            # Savepoint transaction
            db.begin_nested()

            # Check if student is already promoted/enrolled in target academic year
            existing_target_enrollment = db.query(StudentEnrollment).filter_by(
                student_id=student_id,
                academic_year_id=target_academic_year_id
            ).first()

            if existing_target_enrollment:
                raise Exception(f"Already enrolled in Academic Year {target_ay.year_name} under Class {existing_target_enrollment.school_class}")

            # Retrieve current active enrollment
            current_active_enrollment = db.query(StudentEnrollment).filter(
                StudentEnrollment.student_id == student_id,
                StudentEnrollment.status == "Active"
            ).first()

            current_ay_id = current_active_enrollment.academic_year_id if current_active_enrollment else None

            # Handle Graduation Flow
            if previous_class == "12" or is_graduation:
                if current_active_enrollment:
                    current_active_enrollment.status = "Completed"
                    current_active_enrollment.promoted_date = datetime.now()

                student.class_ = "Completed"
                student.section = "-"
                
                audit_log = PromotionAuditLog(
                    student_id=student_id,
                    student_name=student_name,
                    current_academic_year_id=current_ay_id or target_academic_year_id,
                    target_academic_year_id=target_academic_year_id,
                    previous_class=previous_class,
                    new_class="Completed",
                    previous_section=previous_section,
                    new_section="-",
                    promoted_by=promoted_by,
                    status="Success"
                )
                db.add(audit_log)
                db.commit()  # Commits savepoint

                success_count += 1
                results.append({
                    "student_id": student_id,
                    "student_name": student_name,
                    "status": "Success"
                })
                continue

            # Standard Promotion Flow
            if current_active_enrollment:
                current_active_enrollment.status = "Promoted"
                current_active_enrollment.promoted_date = datetime.now()

            new_enrollment = StudentEnrollment(
                student_id=student_id,
                academic_year_id=target_academic_year_id,
                school_class=target_class,
                section=target_section,
                roll_number=student.roll_number,
                status="Active",
                promoted_from_enrollment_id=current_active_enrollment.id if current_active_enrollment else None,
                promoted_date=datetime.now()
            )
            db.add(new_enrollment)
            db.flush()

            student.class_ = target_class
            student.section = target_section
            db.flush()

            # Trigger auto fee structures assignment
            try:
                from .fees_service import get_legacy_student_fee_summary
                get_legacy_student_fee_summary(db, student_id, target_academic_year_id)
            except Exception as e:
                raise Exception(f"Failed to auto-assign fees: {str(e)}")

            audit_log = PromotionAuditLog(
                student_id=student_id,
                student_name=student_name,
                current_academic_year_id=current_ay_id or target_academic_year_id,
                target_academic_year_id=target_academic_year_id,
                previous_class=previous_class,
                new_class=target_class,
                previous_section=previous_section,
                new_section=target_section,
                promoted_by=promoted_by,
                status="Success"
            )
            db.add(audit_log)
            db.commit()  # Commits savepoint

            success_count += 1
            results.append({
                "student_id": student_id,
                "student_name": student_name,
                "status": "Success"
            })

        except Exception as e:
            db.rollback()  # Rolls back savepoint
            failed_count += 1
            
            try:
                audit_log = PromotionAuditLog(
                    student_id=student_id,
                    student_name=student_name,
                    current_academic_year_id=current_ay_id or target_academic_year_id,
                    target_academic_year_id=target_academic_year_id,
                    previous_class=previous_class,
                    new_class=target_class,
                    previous_section=previous_section,
                    new_section=target_section,
                    promoted_by=promoted_by,
                    status="Failed",
                    error_message=str(e)
                )
                db.add(audit_log)
                db.commit()
            except Exception as log_error:
                db.rollback()
                print(f"Failed to save promotion failure log: {log_error}")

            results.append({
                "student_id": student_id,
                "student_name": student_name,
                "status": "Failed",
                "error_message": str(e)
            })

    db.commit()

    return {
        "total_processed": len(student_ids),
        "total_success": success_count,
        "total_failed": failed_count,
        "results": results
    }


def get_promotion_logs(db: Session, skip: int = 0, limit: int = 100):
    from sqlalchemy.orm import aliased
    CurrAY = aliased(AcademicYear)
    TargAY = aliased(AcademicYear)
    
    logs = db.query(
        PromotionAuditLog.id,
        PromotionAuditLog.student_id,
        PromotionAuditLog.student_name,
        PromotionAuditLog.current_academic_year_id,
        CurrAY.year_name.label("current_academic_year_name"),
        PromotionAuditLog.target_academic_year_id,
        TargAY.year_name.label("target_academic_year_name"),
        PromotionAuditLog.previous_class,
        PromotionAuditLog.new_class,
        PromotionAuditLog.previous_section,
        PromotionAuditLog.new_section,
        PromotionAuditLog.promoted_by,
        PromotionAuditLog.promotion_date,
        PromotionAuditLog.status,
        PromotionAuditLog.error_message
    ).join(
        CurrAY, PromotionAuditLog.current_academic_year_id == CurrAY.year_id
    ).join(
        TargAY, PromotionAuditLog.target_academic_year_id == TargAY.year_id
    ).order_by(
        PromotionAuditLog.promotion_date.desc()
    ).offset(skip).limit(limit).all()
    
    formatted = []
    for log in logs:
        formatted.append({
            "id": log.id,
            "student_id": log.student_id,
            "student_name": log.student_name,
            "current_academic_year_id": log.current_academic_year_id,
            "current_academic_year_name": log.current_academic_year_name,
            "target_academic_year_id": log.target_academic_year_id,
            "target_academic_year_name": log.target_academic_year_name,
            "previous_class": log.previous_class,
            "new_class": log.new_class,
            "previous_section": log.previous_section,
            "new_section": log.new_section,
            "promoted_by": log.promoted_by,
            "promotion_date": log.promotion_date.strftime("%Y-%m-%d %H:%M:%S") if log.promotion_date else "",
            "status": log.status,
            "error_message": log.error_message
        })
        
    return formatted






