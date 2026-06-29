from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from .base import Base

class StudentEnrollment(Base):
    __tablename__ = "student_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.student_id", ondelete="CASCADE"), index=True, nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.year_id", ondelete="CASCADE"), index=True, nullable=False)
    school_class = Column("school_class", String, nullable=False)
    section = Column(String, nullable=False)
    roll_number = Column(String, nullable=True)
    status = Column(String(50), default="Active", nullable=False)  # Active, Completed, Promoted, Transferred
    promoted_from_enrollment_id = Column(Integer, ForeignKey("student_enrollments.id", ondelete="SET NULL"), nullable=True)
    promoted_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    student = relationship("Student", back_populates="enrollments")
    academic_year = relationship("AcademicYear")
    promoted_from = relationship("StudentEnrollment", remote_side=[id])

    __table_args__ = (
        UniqueConstraint("student_id", "academic_year_id", name="uq_student_academic_year"),
    )
