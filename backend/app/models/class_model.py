from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey
from .base import Base

class ClassModel(Base):
    __tablename__ = "class"

    class_name = Column("class", String, primary_key=True)
    section = Column(String, primary_key=True)
    class_teacher = Column(String)
    academic_year = Column(String)
