from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...services import attendance_service
from ...api.deps import get_current_user
from ...models.user import User
from ...models.student import Student

router = APIRouter()

@router.get("/{student_id}")
def get_student_attendance(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "parent":
        student = db.query(Student).filter(Student.student_id == student_id).first()
        if not student or student.parent_id != current_user.parent_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user.role == "student":
        if current_user.student_id != student_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return attendance_service.get_attendance_for_student(db, student_id)

