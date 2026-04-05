from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...services import parent_service, notification_service
from ...schemas import notification_schema
from typing import List, Optional

router = APIRouter()

@router.get("/students/{parent_id}")
def get_parent_students(parent_id: str, db: Session = Depends(get_db)):
    return parent_service.get_students_for_parent(db, parent_id)

@router.get("/parent/notifications", response_model=List[notification_schema.Notification])
def get_parent_notifications(class_name: Optional[str] = None, db: Session = Depends(get_db)):
    return notification_service.get_notifications_for_parent(db, class_name)
