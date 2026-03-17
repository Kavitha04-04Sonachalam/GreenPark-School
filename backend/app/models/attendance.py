from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, Date, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.student_id"))
    date = Column(Date)
    class_ = Column("class", String)
    section = Column(String)
    status = Column(String) # Present/Absent
    remarks = Column(String)
    academic_year = Column(String)

    student = relationship("Student", back_populates="attendance")
