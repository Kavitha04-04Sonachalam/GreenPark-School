from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class Fees(Base):
    __tablename__ = "fees"

    fee_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.student_id"))
    month = Column(String)
    year = Column(Integer)
    fee_type = Column(String) # Tuition, Transport, etc.
    amount = Column(Float)
    due_date = Column(Date)
    status = Column(String) # Paid, Pending
    paid_date = Column(Date)
    payment_method = Column(String)

    student = relationship("Student", back_populates="fees")
