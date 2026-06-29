from pydantic import BaseModel, Field
from typing import Optional, List

class LoginRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\d{10}$")
    password: str
    role: str # parent, student, staff, admin

class UserResponse(BaseModel):
    id: str
    parent_id: Optional[str] = None
    student_id: Optional[str] = None
    staff_id: Optional[str] = None
    admin_id: Optional[str] = None
    phone_number: str
    email: Optional[str] = None
    name: str
    role: str
    profile_image_url: Optional[str] = None
    children: Optional[List[dict]] = []
    department: Optional[str] = None
    class_name: Optional[str] = None
    admission_number: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ResetPasswordRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\d{10}$")
    new_password: str

class ChangePasswordRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\d{10}$")
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\d{10}$")

class PasswordResetRequestResponse(BaseModel):
    id: int
    phone_number: str
    parent_id: Optional[str]
    parent_name: Optional[str]
    request_time: str
    status: str

    class Config:
        from_attributes = True

class ResetParentPasswordRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\d{10}$")

