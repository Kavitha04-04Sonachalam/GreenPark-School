from pydantic import BaseModel
from typing import Optional

class InstagramMediaSchema(BaseModel):
    id: str
    caption: Optional[str] = None
    media_type: str
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    permalink: Optional[str] = None
    timestamp: Optional[str] = None

    class Config:
        from_attributes = True
