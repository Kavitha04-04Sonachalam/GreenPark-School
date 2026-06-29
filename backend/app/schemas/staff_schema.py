from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date, datetime

class StaffBase(BaseModel):
    employee_id: str = Field(..., description="Unique Employee ID")
    employee_name: str = Field(..., description="Full Employee Name")
    gender: str = Field(..., description="Gender")
    mobile_no: str = Field(..., description="10-digit mobile number")
    designation: str = Field(..., description="Job Designation")
    date_of_joining: date = Field(..., description="Date of Joining")
    door_no: Optional[str] = None
    street_name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    access_rights: Optional[str] = None
    is_active: Optional[bool] = True

    @field_validator('employee_id')
    @classmethod
    def validate_employee_id(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Employee ID cannot be empty")
        return v.strip()

    @field_validator('employee_name')
    @classmethod
    def validate_employee_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Employee Name cannot be empty")
        return v.strip()

    @field_validator('mobile_no')
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        v_clean = v.strip()
        if not v_clean.isdigit() or len(v_clean) != 10:
            raise ValueError("Mobile Number must be exactly 10 digits")
        return v_clean

    @field_validator('pincode')
    @classmethod
    def validate_pincode(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v_clean = v.strip()
        if v_clean and (not v_clean.isdigit() or len(v_clean) != 6):
            raise ValueError("Pincode must be exactly 6 digits")
        return v_clean

class StaffCreate(StaffBase):
    password: str = Field(..., min_length=8, description="Minimum 8 characters password")

class StaffUpdate(BaseModel):
    employee_name: Optional[str] = None
    gender: Optional[str] = None
    mobile_no: Optional[str] = None
    designation: Optional[str] = None
    date_of_joining: Optional[date] = None
    door_no: Optional[str] = None
    street_name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    access_rights: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None # Hashed and updated if provided

    @field_validator('employee_name')
    @classmethod
    def validate_employee_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Employee Name cannot be empty")
        return v.strip() if v is not None else None

    @field_validator('mobile_no')
    @classmethod
    def validate_mobile(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v_clean = v.strip()
        if not v_clean.isdigit() or len(v_clean) != 10:
            raise ValueError("Mobile Number must be exactly 10 digits")
        return v_clean

    @field_validator('pincode')
    @classmethod
    def validate_pincode(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v_clean = v.strip()
        if v_clean and (not v_clean.isdigit() or len(v_clean) != 6):
            raise ValueError("Pincode must be exactly 6 digits")
        return v_clean

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if v == "" or v.strip() == "":
                return None
            if len(v) < 8:
                raise ValueError("Password must be at least 8 characters long")
        return v

class StaffResponse(StaffBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
