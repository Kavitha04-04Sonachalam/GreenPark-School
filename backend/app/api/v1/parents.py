from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...services import parent_service, notification_service
from ...schemas import notification_schema
from ...api.deps import get_current_user
from ...models.user import User
from ...models.student import Student
from typing import List, Optional

router = APIRouter()

@router.get("/students/{parent_id}")
def get_parent_students(
    parent_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "parent":
        if current_user.parent_id != parent_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == "student":
        student = db.query(Student).filter(Student.student_id == current_user.student_id).first()
        if not student or student.parent_id != parent_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return parent_service.get_students_for_parent(db, parent_id)

@router.get("/parent/notifications", response_model=List[notification_schema.Notification])
def get_parent_notifications(
    class_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return notification_service.get_notifications_for_parent(db, class_name)

