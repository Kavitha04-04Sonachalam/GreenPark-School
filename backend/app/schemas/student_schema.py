from pydantic import BaseModel
from typing import Optional

class StudentBase(BaseModel):
    first_name: str
    last_name: str
    section: str

class StudentResponse(StudentBase):
    student_id: int
    parent_id: int

    class Config:
        from_attributes = True

class StudentDashboardResponse(BaseModel):
    id: str
    name: str # Combined first + last
    class_: str # React uses "class" but Python uses "class_"
    rollNo: str # CamelCase for frontend

    class Config:
        from_attributes = True
        populate_by_name = True
