from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String) # parent or admin
    parent_id = Column(String, nullable=True)

    parent = relationship("Parent", back_populates="user", primaryjoin="User.parent_id == Parent.parent_id", foreign_keys=[parent_id])
