from pydantic import BaseModel
from datetime import date
from typing import Optional

class ActivityBase(BaseModel):
    title: str
    description: str
    event_date: date
    image_url: Optional[str] = None

class ActivityCreate(ActivityBase):
    pass

class ActivitySchema(ActivityBase):
    id: int

    class Config:
        from_attributes = True
