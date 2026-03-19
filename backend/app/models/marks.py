from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, Float, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class Marks(Base):
    __tablename__ = "marks"

    mark_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.student_id"))
    class_ = Column("class", String)
    section = Column(String)
    subject = Column(String)
    exam_type = Column(String) # Midterm, Quarterly, Final, etc.
    marks_obtained = Column(Float)
    total_marks = Column(Float, default=100.0)
    exam_date = Column(Date)
    academic_year = Column(String)

    student = relationship("Student", back_populates="marks")
