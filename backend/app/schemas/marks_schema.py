from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date

class MarksBase(BaseModel):
    subject: str
    marks: float
    exam_type: str
    exam_date: Optional[date] = None

class MarksResponse(BaseModel):
    subject: str
    marks: float
    exam_type: str
    percentage: Optional[float] = None

    class Config:
        from_attributes = True

class StudentMarksResponse(BaseModel):
    student_id: str
    marks: List[MarksResponse]

class BulkMarkEntry(BaseModel):
    student_id: str
    marks: float

class BulkMarksSaveRequest(BaseModel):
    class_name: str = Field(alias="class")
    section: str
    exam_type: str
    subject: str
    marks: List[BulkMarkEntry]

