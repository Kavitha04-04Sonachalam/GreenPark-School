from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PasswordResetRequestSchema(BaseModel):
    id: int
    phone_number: str
    parent_name: Optional[str] = None # Added for UI
    request_time: datetime
    status: str

    class Config:
        from_attributes = True

class ResetPasswordAction(BaseModel):
    phone_number: str
