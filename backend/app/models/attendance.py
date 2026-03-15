from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, Date, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class Attendance(Base):
    __tablename__ = "attendance"

    student_id = Column(String, ForeignKey("students.student_id"), primary_key=True)
    date = Column(Date, primary_key=True)
    status = Column(String) # Present/Absent
    remarks = Column(String)
    academic_year = Column(String)

    student = relationship("Student", back_populates="attendance")
