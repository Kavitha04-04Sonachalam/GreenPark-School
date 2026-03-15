from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...services import parent_service

router = APIRouter()

@router.get("/students/{parent_id}")
def get_parent_students(parent_id: str, db: Session = Depends(get_db)):
    return parent_service.get_students_for_parent(db, parent_id)
