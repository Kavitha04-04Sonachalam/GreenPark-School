from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .base import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, index=True)
    password = Column(String)
    role = Column(String) # parent, student, staff, or admin
    parent_id = Column(String, nullable=True)
    student_id = Column(String, nullable=True)
    staff_id = Column(String, nullable=True)
    admin_id = Column(String, nullable=True)
    can_collect_fee = Column(Boolean, default=False, nullable=True)

    parent = relationship("Parent", back_populates="user", primaryjoin="User.parent_id == Parent.parent_id", foreign_keys=[parent_id])
    staff = relationship("Staff", back_populates="user", primaryjoin="User.user_id == Staff.user_id", foreign_keys="Staff.user_id", uselist=False, cascade="all, delete-orphan")
    admin = relationship("Admin", back_populates="user", primaryjoin="User.admin_id == Admin.admin_id", foreign_keys=[admin_id])
    student = relationship("Student", primaryjoin="User.student_id == Student.student_id", foreign_keys=[student_id])

