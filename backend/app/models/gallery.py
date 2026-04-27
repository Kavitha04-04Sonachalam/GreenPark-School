from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base
import enum

class MediaType(enum.Enum):
    IMAGE = "image"
    VIDEO = "video"

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    thumbnail_url = Column(String(1024), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    media = relationship("Media", back_populates="event", cascade="all, delete-orphan")

class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    media_url = Column(String(1024), nullable=False)
    media_type = Column(String(50), default="image") # image or video
    created_at = Column(DateTime, default=datetime.utcnow)

    event = relationship("Event", back_populates="media")
