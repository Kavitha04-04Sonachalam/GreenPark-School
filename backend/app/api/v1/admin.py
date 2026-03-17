from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ...core.database import get_db
from ...services import admin_service
from ...schemas import student_schema, parent_schema, marks_schema, attendance_schema, activity_schema, announcement_schema, dashboard_schema, password_reset_schema, fees_schema
from ..deps import get_current_admin_user

router = APIRouter()

@router.get("/dashboard-summary", response_model=dashboard_schema.DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.get_dashboard_summary(db)

# Student Management
@router.post("/students", response_model=student_schema.StudentSchema)
def create_student(student_data: student_schema.StudentCreate, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.create_student(db, student_data.dict())

@router.get("/students", response_model=List[student_schema.StudentSchema])
def get_students(skip: int = 0, limit: int = 100, class_name: Optional[str] = None, section: Optional[str] = None, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.get_students(db, skip, limit, class_name, section)

@router.put("/students/{student_id}", response_model=student_schema.StudentSchema)
def update_student(student_id: str, student_data: student_schema.StudentUpdate, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.update_student(db, student_id, student_data.dict(exclude_unset=True))

@router.delete("/students/{student_id}")
def delete_student(student_id: str, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.delete_student(db, student_id)

# Parent Management
@router.post("/parents", response_model=parent_schema.ParentSchema)
def create_parent(parent_data: parent_schema.ParentCreate, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.create_parent(db, parent_data.dict())

@router.get("/parents", response_model=List[parent_schema.ParentSchema])
def get_parents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.get_parents(db, skip, limit)

# Marks Management (Bulk)
@router.post("/marks")
def enter_bulk_marks(marks_data: marks_schema.BulkMarksSaveRequest, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.enter_bulk_marks(db, marks_data.dict())

# Attendance Management (Bulk)
@router.post("/attendance")
def mark_bulk_attendance(attendance_data: attendance_schema.BulkAttendanceSaveRequest, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.mark_bulk_attendance(db, attendance_data.dict())

# Activities
@router.get("/activities", response_model=List[activity_schema.ActivitySchema])
def get_activities(db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.get_activities(db)

@router.post("/activities", response_model=activity_schema.ActivitySchema)
def create_activity(activity_data: activity_schema.ActivityCreate, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.create_activity(db, activity_data.dict())

@router.delete("/activities/{activity_id}")
def delete_activity(activity_id: int, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.delete_activity(db, activity_id)

# Announcements
@router.get("/announcements", response_model=List[announcement_schema.AnnouncementSchema])
def get_announcements(db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.get_announcements(db)

@router.post("/announcements", response_model=announcement_schema.AnnouncementSchema)
def create_announcement(announcement_data: announcement_schema.AnnouncementCreate, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.create_announcement(db, announcement_data.dict())

# Password Resets
@router.get("/password-reset-requests", response_model=List[password_reset_schema.PasswordResetRequestSchema])
def get_password_reset_requests(db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.get_password_reset_requests(db)

@router.post("/reset-parent-password")
def reset_parent_password(data: password_reset_schema.ResetPasswordAction, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    user = admin_service.reset_parent_password(db, data.phone_number)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Password reset successfully"}

# Fees
@router.get("/fees")
def get_all_fees(db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    fees = admin_service.get_all_fees(db)
    # Format for UI
    return [{
        "student_id": f.student_id,
        "student_name": f"{f.student.first_name} {f.student.last_name}",
        "class": f"{f.student.class_}{f.student.section}",
        "amount": f.amount,
        "status": f.status,
        "month": f.month,
        "fee_id": f.fee_id
    } for f in fees]
