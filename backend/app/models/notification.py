from sqlalchemy import Column, Integer, String, Text, DateTime, func
from .base import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    target_type = Column(String(50), nullable=False) # 'all' or 'class' or 'admin'
    class_name = Column(String(50), nullable=True)
    type = Column(String(50), nullable=True) # e.g., 'ENQUIRY'
    reference_id = Column(Integer, nullable=True)
    is_read = Column(Integer, default=0) # 0 for false, 1 for true
    created_at = Column(DateTime(timezone=True), server_default=func.now())
