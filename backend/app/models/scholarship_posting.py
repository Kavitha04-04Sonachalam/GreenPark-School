from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class ScholarshipPosting(Base):
    __tablename__ = "scholarship_postings"

    id = Column(Integer, primary_key=True, index=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.year_id", ondelete="CASCADE"), index=True, nullable=False)
    student_id = Column(String, ForeignKey("students.student_id", ondelete="CASCADE"), index=True, nullable=False)
    scholarship_id = Column(Integer, ForeignKey("scholarships.id", ondelete="CASCADE"), index=True, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)

    academic_year = relationship("AcademicYear")
    student = relationship("Student")
    scholarship = relationship("Scholarship")
