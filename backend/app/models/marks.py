from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import Base

class Marks(Base):
    __tablename__ = "marks"
    __table_args__ = (
        UniqueConstraint('student_id', 'exam_type', 'subject', 'academic_year', name='uq_student_exam_subject_year'),
    )

    mark_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.student_id"), index=True)
    class_ = Column("class", String)
    section = Column(String)
    subject = Column(String)
    exam_type = Column(String) # Midterm, Quarterly, Final, etc.
    marks_obtained = Column(Float)
    total_marks = Column(Float, default=100.0)
    exam_date = Column(Date)
    academic_year = Column(String, index=True)

    # Sync Tracking Fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    sync_status = Column(String, default="synced", index=True)  # 'synced', 'pending', 'sync_failed'
    sync_attempts = Column(Integer, default=0)

    student = relationship("Student", back_populates="marks")
