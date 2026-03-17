from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from .base import Base

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    message = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
