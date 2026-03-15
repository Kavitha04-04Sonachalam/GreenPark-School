from pydantic import BaseModel
from typing import Optional
from datetime import date

class MarksBase(BaseModel):
    subject: str
    marks_obtained: float
    total_marks: float
    exam_type: str
    exam_date: Optional[date] = None

class MarksResponse(BaseModel):
    subject: str
    marks_obtained: float
    total_marks: float
    percentage: float

    class Config:
        from_attributes = True

class StudentMarksResponse(BaseModel):
    student_id: str
    marks: list[MarksResponse]

