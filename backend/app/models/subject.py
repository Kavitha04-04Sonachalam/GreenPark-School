from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey
from .base import Base

class Subject(Base):
    __tablename__ = "subject"

    suvj_id = Column(Integer, primary_key=True, index=True)
    subj_name = Column(String, index=True)
    class_ = Column("class", String)
    academic_year = Column(String)
