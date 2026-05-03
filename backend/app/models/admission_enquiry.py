from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from .base import Base

class AdmissionEnquiry(Base):
    __tablename__ = "admission_enquiries"

    id = Column(Integer, primary_key=True, index=True)
    student_name = Column(String, nullable=False)
    class_applied = Column(String, nullable=False)
    parent_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
