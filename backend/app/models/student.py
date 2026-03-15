from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class Student(Base):
    __tablename__ = "students"

    student_id = Column(String, primary_key=True, index=True)
    admission_number = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    class_ = Column("class", String) # Map to reserved keyword "class"
    section = Column(String)
    roll_number = Column(String)
    parent_id = Column(String, ForeignKey("parents.parent_id"))

    parent = relationship("Parent", back_populates="students")
    attendance = relationship("Attendance", back_populates="student")
    marks = relationship("Marks", back_populates="student")
    fees = relationship("Fees", back_populates="student")
