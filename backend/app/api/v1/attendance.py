from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...services import attendance_service

router = APIRouter()

@router.get("/{student_id}")
def get_student_attendance(student_id: str, db: Session = Depends(get_db)):
    return attendance_service.get_attendance_for_student(db, student_id)
