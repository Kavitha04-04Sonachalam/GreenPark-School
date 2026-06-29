from pydantic import BaseModel
from typing import Optional

class ScholarshipBase(BaseModel):
    name: str

class ScholarshipCreate(ScholarshipBase):
    pass

class ScholarshipSchema(ScholarshipBase):
    id: int

    class Config:
        from_attributes = True

class ScholarshipPostingBase(BaseModel):
    academic_year_id: int
    student_id: str
    scholarship_id: int
    amount: float

class ScholarshipPostingCreate(ScholarshipPostingBase):
    pass

class ScholarshipPostingSchema(ScholarshipPostingBase):
    id: int
    student_name: Optional[str] = None
    school_class: Optional[str] = None
    roll_no: Optional[str] = None
    scholarship_name: Optional[str] = None
    year_name: Optional[str] = None

    class Config:
        from_attributes = True
