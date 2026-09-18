from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, UniqueConstraint, DateTime
from sqlalchemy.orm import relationship
from .base import Base

class FeeStructure(Base):
    __tablename__ = "fee_structures"

    id = Column(Integer, primary_key=True, index=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.year_id", ondelete="CASCADE"), nullable=False)
    school_class = Column(String, index=True, nullable=False)
    term_id = Column(Integer, ForeignKey("terms.term_id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("fee_categories.category_id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)

    # Sync Tracking Fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)
    sync_status = Column(String, default="synced", index=True)
    sync_attempts = Column(Integer, default=0)

    academic_year = relationship("AcademicYear")
    term = relationship("Term")
    category = relationship("FeeCategory")

    __table_args__ = (
        UniqueConstraint('academic_year_id', 'school_class', 'term_id', 'category_id', name='_academic_year_class_term_category_uc'),
    )
