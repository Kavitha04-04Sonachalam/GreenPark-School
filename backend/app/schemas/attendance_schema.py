from pydantic import BaseModel, Field
from datetime import date
from typing import List, Optional

class AttendanceBase(BaseModel):
    date: date
    status: str
    subject: str = "General"

class AttendanceResponse(AttendanceBase):
    id: int
    student_id: str
    class_name: str = Field(alias="class")
    section: str

    class Config:
        from_attributes = True
        populate_by_name = True

class BulkAttendanceEntry(BaseModel):
    student_id: str
    status: str

class BulkAttendanceSaveRequest(BaseModel):
    date: date
    class_name: str = Field(alias="class")
    section: str
    academic_year: Optional[str] = None
    academic_year_id: Optional[int] = None
    attendance: List[BulkAttendanceEntry]
