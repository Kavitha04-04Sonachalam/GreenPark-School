from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import Base

class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint('student_id', 'date', name='uq_student_date_attendance'),
    )

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.student_id"), index=True)
    date = Column(Date, index=True)
    class_ = Column("class", String)
    section = Column(String)
    status = Column(String) # Present/Absent
    remarks = Column(String, nullable=True)
    academic_year = Column(String, index=True)

    # Sync Tracking Fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    sync_status = Column(String, default="synced", index=True)  # 'synced', 'pending', 'sync_failed'
    sync_attempts = Column(Integer, default=0)

    student = relationship("Student", back_populates="attendance")
