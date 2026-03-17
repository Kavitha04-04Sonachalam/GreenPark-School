from sqlalchemy import Column, Integer, String, Date
from .base import Base

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    event_date = Column(Date)
    image_url = Column(String, nullable=True)
