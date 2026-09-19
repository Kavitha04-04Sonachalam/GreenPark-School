from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import Base

class ScholarshipPosting(Base):
    __tablename__ = "scholarship_postings"
    __table_args__ = (
        UniqueConstraint('student_id', 'academic_year_id', 'scholarship_id', name='uq_scholarship_posting_student_year'),
    )

    id = Column(Integer, primary_key=True, index=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.year_id", ondelete="CASCADE"), index=True, nullable=False)
    student_id = Column(String, ForeignKey("students.student_id", ondelete="CASCADE"), index=True, nullable=False)
    scholarship_id = Column(Integer, ForeignKey("scholarships.id", ondelete="CASCADE"), index=True, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)

    # Sync Tracking Fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    sync_status = Column(String, default="synced", index=True)
    sync_attempts = Column(Integer, default=0)

    academic_year = relationship("AcademicYear")
    student = relationship("Student")
    scholarship = relationship("Scholarship")
