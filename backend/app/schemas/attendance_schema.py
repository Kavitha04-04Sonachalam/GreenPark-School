from pydantic import BaseModel
from datetime import date

class AttendanceBase(BaseModel):
    date: date
    status: str
    subject: str

class AttendanceResponse(AttendanceBase):
    id: int
    student_id: int

    class Config:
        from_attributes = True
