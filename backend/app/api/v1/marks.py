from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...services import marks_service

from typing import Optional

router = APIRouter()

@router.get("/{student_id}")
def get_student_marks(student_id: str, exam_type: Optional[str] = None, db: Session = Depends(get_db)):
    return marks_service.get_marks_for_student(db, student_id, exam_type)
