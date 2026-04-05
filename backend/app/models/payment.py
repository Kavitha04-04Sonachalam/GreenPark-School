from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from .base import Base

class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.student_id", ondelete="CASCADE"))
    amount = Column(Float)
    payment_date = Column(Date)
