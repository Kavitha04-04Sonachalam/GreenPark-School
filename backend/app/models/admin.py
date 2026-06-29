from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from .base import Base

class Admin(Base):
    __tablename__ = "admins"

    admin_id = Column(String, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    permissions = Column(String, nullable=True)
    profile_image_url = Column(String, nullable=True)

    user = relationship(
        "User",
        back_populates="admin",
        uselist=False,
        primaryjoin="Admin.admin_id == User.admin_id",
        foreign_keys="User.admin_id"
    )
