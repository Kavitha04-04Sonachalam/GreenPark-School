from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ...core.database import get_db
from ...services import admin_service, notification_service
from ...schemas import student_schema, parent_schema, marks_schema, attendance_schema, activity_schema, announcement_schema, dashboard_schema, password_reset_schema, fees_schema, notification_schema
from ..deps import get_current_admin_user

router = APIRouter()

@router.get("/dashboard-summary", response_model=dashboard_schema.DashboardSummary)
def get_dashboard_summary(
    class_name: Optional[str] = None, 
    section: Optional[str] = None, 
    db: Session = Depends(get_db), 
    admin = Depends(get_current_admin_user)
):
    return admin_service.get_dashboard_summary(db, class_name=class_name, section=section)

# Student Management
from fastapi import Request

@router.post("/students", response_model=student_schema.StudentSchema)
async def create_student(request: Request, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    data = await request.json()
    student_dict = {
        "first_name": data.get("first_name"),
        "last_name": data.get("last_name"),
        "gender": data.get("gender"),
        "date_of_birth": data.get("date_of_birth"),
        "class_": data.get("class", data.get("class_")),
        "section": data.get("section"),
        "roll_number": data.get("roll_no", data.get("roll_number")),
        "academic_year": data.get("academic_year"),
        "parent_id": data.get("parent_id")
    }
    
    # Handle legacy 'name' field if present
    if "name" in data and not student_dict["first_name"]:
        parts = data["name"].strip().split()
        student_dict["first_name"] = parts[0]
        if not student_dict["last_name"]:
            student_dict["last_name"] = " ".join(parts[1:]) if len(parts) > 1 else "."
            
    student_dict["admission_number"] = data.get("admission_number", f"ADM-{student_dict['roll_number']}")
    
    return admin_service.create_student(db, student_dict)

@router.get("/students", response_model=List[student_schema.StudentSchema])
def get_students(skip: int = 0, limit: int = 100, class_name: Optional[str] = None, section: Optional[str] = None, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.get_students(db, skip, limit, class_name, section)

@router.put("/students/{student_id}", response_model=student_schema.StudentSchema)
async def update_student(student_id: str, request: Request, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    data = await request.json()
    student_dict = {}
    
    keys = ["first_name", "last_name", "gender", "date_of_birth", "section", "academic_year", "parent_id", "admission_number"]
    for k in keys:
        if k in data:
            student_dict[k] = data[k]
            
    if "class" in data or "class_" in data:
        student_dict["class_"] = data.get("class", data.get("class_"))
    if "roll_no" in data or "roll_number" in data:
        student_dict["roll_number"] = data.get("roll_no", data.get("roll_number"))
        
    if "name" in data and "first_name" not in data:
        parts = data["name"].strip().split()
        student_dict["first_name"] = parts[0]
        if "last_name" not in data:
            student_dict["last_name"] = " ".join(parts[1:]) if len(parts) > 1 else "."
            
    return admin_service.update_student(db, student_id, student_dict)

@router.delete("/students/{student_id}")
def delete_student(student_id: str, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.delete_student(db, student_id)

# Parent Management
@router.post("/parents", response_model=parent_schema.ParentSchema)
def create_parent(parent_data: parent_schema.ParentCreate, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.create_parent(db, parent_data.dict())

@router.put("/parents/{parent_id}", response_model=parent_schema.ParentSchema)
def update_parent(parent_id: str, parent_data: parent_schema.ParentUpdate, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.update_parent(db, parent_id, parent_data.dict(exclude_unset=True))

@router.get("/parents", response_model=List[parent_schema.ParentSchema])
def get_parents(skip: int = 0, limit: int = 100, class_name: Optional[str] = None, section: Optional[str] = None, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return admin_service.get_parents(db, skip, limit, class_name, section)

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

# Notifications
@router.post("/notifications", response_model=notification_schema.Notification)
def create_notification(notification_data: notification_schema.NotificationCreate, db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return notification_service.create_notification(db, notification_data.dict())

@router.get("/notifications", response_model=List[notification_schema.Notification])
def get_all_notifications(db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return notification_service.get_all_notifications(db)

# Fees
@router.get("/fees")
def get_all_fees(
    class_name: Optional[str] = None, 
    section: Optional[str] = None, 
    db: Session = Depends(get_db), 
    admin = Depends(get_current_admin_user)
):
    return admin_service.get_all_fees(db, class_name=class_name, section=section)

