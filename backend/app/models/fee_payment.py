from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base

class FeePayment(Base):
    __tablename__ = "fee_payments"

    id = Column(Integer, primary_key=True, index=True)
    receipt_no = Column(String(30), index=True, nullable=False)
    student_id = Column(String, ForeignKey("students.student_id", ondelete="CASCADE"), index=True, nullable=False)
    fee_structure_id = Column(Integer, ForeignKey("fee_structures.id", ondelete="CASCADE"), index=True, nullable=False)
    amount_paid = Column(Numeric(10, 2), nullable=False)
    payment_mode = Column(String(20), nullable=False) # Cash, UPI, Card, Scholarship
    payment_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    student = relationship("Student")
    fee_structure = relationship("FeeStructure")
