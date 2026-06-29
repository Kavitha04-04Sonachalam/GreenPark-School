from pydantic import BaseModel
from typing import Optional

class FeeStructureBase(BaseModel):
    academic_year_id: int
    school_class: str
    term_id: int
    category_id: int
    amount: float

class FeeStructureCreate(FeeStructureBase):
    pass

class FeeStructureSchema(FeeStructureBase):
    id: int
    year_name: Optional[str] = None
    term_name: Optional[str] = None
    category_name: Optional[str] = None

    class Config:
        from_attributes = True

class DuplicateFeeStructureRequest(BaseModel):
    source_academic_year_id: int
    target_academic_year_id: int
