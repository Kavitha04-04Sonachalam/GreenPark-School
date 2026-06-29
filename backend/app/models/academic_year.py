from sqlalchemy import Column, Integer, String, Date
from .base import Base

class AcademicYear(Base):
    __tablename__ = "academic_years"

    year_id = Column(Integer, primary_key=True, index=True)
    year_name = Column(String(50), unique=True, index=True, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(20), default="INACTIVE", nullable=False)
