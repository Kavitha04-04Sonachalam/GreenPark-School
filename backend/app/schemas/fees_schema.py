from pydantic import BaseModel
from datetime import date
from typing import Optional

class FeesBase(BaseModel):
    type: str # Tuition, Transport, etc.
    amount: float
    dueDate: str # camelCase
    status: str # Paid, Pending
    month: str

class FeesResponse(BaseModel):
    id: str # fee_id as string for frontend
    type: str # fee_type
    amount: float
    dueDate: str # due_date as string
    status: str
    month: str
    year: Optional[int] = None

    class Config:
        from_attributes = True
        populate_by_name = True
