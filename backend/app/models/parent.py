from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class Parent(Base):
    __tablename__ = "parents"

    parent_id = Column(String, primary_key=True, index=True)
    father_name = Column(String)
    mother_name = Column(String)
    phone_primary = Column(String, unique=True, index=True)
    address = Column(String)

    user = relationship("User", back_populates="parent", uselist=False, primaryjoin="Parent.parent_id == User.parent_id", foreign_keys="User.parent_id")
    students = relationship("Student", back_populates="parent")
