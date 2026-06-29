from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship
from .base import Base

class Staff(Base):
    __tablename__ = "staff"

    # Primary key and core requested fields
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=False)
    employee_name = Column(String, nullable=False)
    gender = Column(String, nullable=False)
    mobile_no = Column(String, unique=True, index=True, nullable=False)
    designation = Column(String, nullable=False)
    date_of_joining = Column(Date, nullable=False)
    door_no = Column(String, nullable=True)
    street_name = Column(String, nullable=True)
    state = Column(String, nullable=True)
    district = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    access_rights = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    # Legacy compatibility fields (so existing authentication & queries do not break)
    staff_id = Column(String, unique=True, index=True, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    department = Column(String, nullable=True)
    profile_image_url = Column(String, nullable=True)

    user = relationship(
        "User",
        back_populates="staff",
        uselist=False,
        primaryjoin="Staff.user_id == User.user_id",
        foreign_keys=[user_id]
    )
