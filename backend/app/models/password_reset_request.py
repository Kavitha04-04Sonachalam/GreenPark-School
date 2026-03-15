from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from .base import Base

class PasswordResetRequest(Base):
    __tablename__ = "password_reset_requests"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, index=True)
    parent_id = Column(String, nullable=True)
    request_time = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="pending") # pending / resolved
