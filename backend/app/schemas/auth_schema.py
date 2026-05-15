from pydantic import BaseModel, Field
from typing import Optional, List

class LoginRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\d{10}$")
    password: str
    role: str # parent or admin

class UserResponse(BaseModel):
    id: str
    parent_id: Optional[str] = None
    phone_number: str
    email: Optional[str]
    name: str
    role: str
    profile_image_url: Optional[str] = None
    children: Optional[List[dict]] = []

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

