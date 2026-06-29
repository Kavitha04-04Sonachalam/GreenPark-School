from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date


class StudentBase(BaseModel):
    first_name: str
    last_name: str
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    class_: str = Field(..., alias="class_")
    section: str
    roll_number: str
    academic_year: Optional[str] = None
    admission_number: str
    parent_id: str

    class Config:
        populate_by_name = True

class StudentCreate(StudentBase):
    student_id: Optional[str] = None

class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    class_: Optional[str] = Field(None, alias="class_")
    section: Optional[str] = None
    roll_number: Optional[str] = None
    academic_year: Optional[str] = None
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

class StudentPromotion(BaseModel):
    target_academic_year_id: int
    target_class: str = Field(..., alias="class")
    target_section: str = Field(..., alias="section")

    class Config:
        populate_by_name = True

class StudentPromotionStatus(BaseModel):
    student_id: str
    first_name: str
    last_name: str
    roll_number: Optional[str] = None
    current_class: str
    current_section: str
    already_promoted: bool
    promoted_to_class: Optional[str] = None
    promoted_to_section: Optional[str] = None
    promotion_status: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True

class BulkPromotionRequest(BaseModel):
    student_ids: List[str]
    target_academic_year_id: int
    target_class: str = Field(..., alias="class")
    target_section: str = Field(..., alias="section")

    class Config:
        populate_by_name = True

class BulkPromotionIndividualResult(BaseModel):
    student_id: str
    student_name: str
    status: str  # Success, Failed
    error_message: Optional[str] = None

    class Config:
        from_attributes = True

class BulkPromotionResponse(BaseModel):
    total_processed: int
    total_success: int
    total_failed: int
    results: List[BulkPromotionIndividualResult]

class PromotionAuditLogSchema(BaseModel):
    id: int
    student_id: str
    student_name: str
    current_academic_year_id: int
    current_academic_year_name: str
    target_academic_year_id: int
    target_academic_year_name: str
    previous_class: str
    new_class: str
    previous_section: str
    new_section: str
    promoted_by: str
    promotion_date: str
    status: str
    error_message: Optional[str] = None

    class Config:
        from_attributes = True
        populate_by_name = True

