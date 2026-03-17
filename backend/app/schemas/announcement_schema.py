from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AnnouncementBase(BaseModel):
    title: str
    message: str

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementSchema(AnnouncementBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
