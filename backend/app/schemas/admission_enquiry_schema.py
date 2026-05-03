from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class AdmissionEnquiryBase(BaseModel):
    student_name: str
    class_applied: str
    parent_name: str
    phone: str = Field(..., pattern=r"^[6-9]\d{9}$")
    message: Optional[str] = None

class AdmissionEnquiryCreate(AdmissionEnquiryBase):
    pass

class AdmissionEnquiryResponse(AdmissionEnquiryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
