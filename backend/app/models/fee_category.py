from sqlalchemy import Column, Integer, String
from .base import Base

class FeeCategory(Base):
    __tablename__ = "fee_categories"

    category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(100), unique=True, index=True, nullable=False)
