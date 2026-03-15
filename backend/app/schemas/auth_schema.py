from pydantic import BaseModel
from typing import Optional, List

class LoginRequest(BaseModel):
    phone_number: str
    password: str
    role: str # parent or admin

class UserResponse(BaseModel):
    id: str
    phone_number: str
    email: Optional[str]
    name: str
    role: str
    children: Optional[List[dict]] = []

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ResetPasswordRequest(BaseModel):
    phone_number: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    phone_number: str
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    phone_number: str

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
    phone_number: str

