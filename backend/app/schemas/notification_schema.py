from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    title: str
    message: str
    target_type: str # 'all', 'class', or 'admin'
    target_classes: Optional[list[str]] = None
    class_name: Optional[str] = None
    type: Optional[str] = None
    reference_id: Optional[int] = None
    is_read: Optional[int] = 0

class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
