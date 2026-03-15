from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...services import fees_service

router = APIRouter()

@router.get("/{student_id}")
def get_student_fees(student_id: str, db: Session = Depends(get_db)):
    return fees_service.get_fees_for_student(db, student_id)
