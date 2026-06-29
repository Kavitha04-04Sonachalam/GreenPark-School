from pydantic import BaseModel
from typing import Optional

class FeeHeadBase(BaseModel):
    name: str
    is_active: Optional[bool] = True

class FeeHeadCreate(FeeHeadBase):
    pass

class FeeHeadUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None

class FeeHeadSchema(FeeHeadBase):
    id: int

    class Config:
        from_attributes = True
