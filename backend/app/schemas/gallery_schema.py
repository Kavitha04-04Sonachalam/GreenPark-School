from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MediaBase(BaseModel):
    media_url: str
    media_type: str = "image"

class MediaCreate(MediaBase):
    pass

class MediaSchema(MediaBase):
    id: int
    event_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class EventBase(BaseModel):
    name: str
    description: Optional[str] = None
    date: datetime
    thumbnail_url: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventSchema(EventBase):
    id: int
    created_at: datetime
    media: List[MediaSchema] = []

    class Config:
        from_attributes = True
