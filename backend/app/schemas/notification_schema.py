from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    title: str
    message: str
    target_type: str # 'all' or 'class'
    target_classes: Optional[list[str]] = None
    class_name: Optional[str] = None

class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
