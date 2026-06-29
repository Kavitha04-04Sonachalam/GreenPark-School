from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from .base import Base

class PromotionAuditLog(Base):
    __tablename__ = "promotion_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.student_id", ondelete="CASCADE"), index=True, nullable=False)
    student_name = Column(String, nullable=False)
    current_academic_year_id = Column(Integer, ForeignKey("academic_years.year_id", ondelete="RESTRICT"), nullable=False)
    target_academic_year_id = Column(Integer, ForeignKey("academic_years.year_id", ondelete="RESTRICT"), nullable=False)
    previous_class = Column(String, nullable=False)
    new_class = Column(String, nullable=False)
    previous_section = Column(String, nullable=False)
    new_section = Column(String, nullable=False)
    promoted_by = Column(String, nullable=False)
    promotion_date = Column(DateTime, default=func.now())
    status = Column(String(50), nullable=False)  # Success, Failed
    error_message = Column(String, nullable=True)

    # Relationships
    student = relationship("Student")
    current_academic_year = relationship("AcademicYear", foreign_keys=[current_academic_year_id])
    target_academic_year = relationship("AcademicYear", foreign_keys=[target_academic_year_id])
