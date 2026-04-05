from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List

class ParentBase(BaseModel):
    father_name: str
    mother_name: str
    phone_primary: str = Field(..., description="Phone Number")
    address: str

class ParentCreate(ParentBase):
    pass

class ParentUpdate(ParentBase):
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    phone_primary: Optional[str] = None
    address: Optional[str] = None

class ParentSchema(ParentBase):
    parent_id: str

    class Config:
        from_attributes = True
