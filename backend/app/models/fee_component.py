from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class FeeComponent(Base):
    __tablename__ = "fee_components"

    id = Column(Integer, primary_key=True, index=True)
    structure_id = Column(Integer, ForeignKey("fee_structures.id", ondelete="CASCADE"), index=True)
    component_name = Column(String)
    amount = Column(Float)

    structure = relationship("FeeStructure", back_populates="components")
