from sqlalchemy import Column, Integer, String
from .base import Base

class Term(Base):
    __tablename__ = "terms"

    term_id = Column(Integer, primary_key=True, index=True)
    term_name = Column(String(30), unique=True, index=True, nullable=False)
