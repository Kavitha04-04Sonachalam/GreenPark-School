from pydantic import BaseModel
from datetime import date

class AcademicYearBase(BaseModel):
    year_name: str
    start_date: date
    end_date: date

class AcademicYearCreate(AcademicYearBase):
    pass

class AcademicYearSchema(AcademicYearBase):
    year_id: int
    status: str

    class Config:
        from_attributes = True
