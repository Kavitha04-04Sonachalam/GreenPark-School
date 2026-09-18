from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from .base import Base

class SyncMeta(Base):
    __tablename__ = "sync_meta"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
