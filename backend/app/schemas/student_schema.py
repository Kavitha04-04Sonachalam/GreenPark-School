from pydantic import BaseModel, Field
from typing import Optional

class StudentBase(BaseModel):
    first_name: str
    last_name: str
    class_: str = Field(..., alias="class_")
    section: str
    roll_number: str
    admission_number: str
    parent_id: str

    class Config:
        populate_by_name = True

class StudentCreate(StudentBase):
    student_id: Optional[str] = None

class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    class_: Optional[str] = Field(None, alias="class_")
    section: Optional[str] = None
    roll_number: Optional[str] = None
    admission_number: Optional[str] = None
    parent_id: Optional[str] = None

    class Config:
        populate_by_name = True

class StudentSchema(StudentBase):
    student_id: str

    class Config:
        from_attributes = True
        populate_by_name = True

class StudentDashboardResponse(BaseModel):
    id: str
    name: str 
    class_: str 
    rollNo: str 

    class Config:
        from_attributes = True
        populate_by_name = True
