from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class FeeComponentSchema(BaseModel):
    id: Optional[int] = None
    component_name: str
    amount: float

    class Config:
        from_attributes = True

class FeeStructureSchema(BaseModel):
    id: Optional[int] = None
    class_name: str
    academic_year: str
    components: List[FeeComponentSchema]

    class Config:
        from_attributes = True

class CreateFeeStructureRequest(BaseModel):
    class_name: str
    academic_year: str
    components: List[FeeComponentSchema]

class UpdateFeeStructureRequest(BaseModel):
    class_name: Optional[str] = None
    academic_year: Optional[str] = None
    components: List[FeeComponentSchema]
