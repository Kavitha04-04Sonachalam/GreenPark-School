from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Student list in Fee Payment filter
class FeePaymentStudent(BaseModel):
    id: str
    name: str
    roll_no: Optional[str] = None
    school_class: Optional[str] = None

# Term list for selected student
class FeePaymentTerm(BaseModel):
    term_id: int
    term_name: str

# Student fee details per structure item
class StudentFeeDetail(BaseModel):
    fee_structure_id: int
    category_name: str
    total: float
    paid: float
    scholarship_applied: float
    balance: float

# Aggregates for student term fee details
class StudentFeeAggregates(BaseModel):
    grand_total: float
    total_paid: float
    total_scholarship_applied: float
    total_balance: float
    total_scholarship_posted: float
    remaining_scholarship: float

# Main response for student term fees detail
class StudentFeeDetailsResponse(BaseModel):
    student: dict # { id, name, roll_no, school_class }
    fees: List[StudentFeeDetail]
    aggregates: StudentFeeAggregates

# Request body for paying fees
class PayFeeRequest(BaseModel):
    student_id: str
    term_id: int
    academic_year_id: int
    cash_amount: float
    upi_amount: float
    card_amount: float

# Response body after paying fees
class PayFeeResponse(BaseModel):
    success: bool
    receipt_no: str
    total_paid_this_payment: float
    term_balance_after: float
    scholarship_applied_this_payment: float
    remaining_scholarship: float

# Receipt item rows
class ReceiptRow(BaseModel):
    category_name: str
    amount_paid: float
    payment_mode: str

# Term fee breakdown inside receipt
class TermFeeBreakdownRow(BaseModel):
    category_name: str
    fee_total: float
    paid_total: float
    balance: float

# Main response for fee receipt details
class FeeReceiptResponse(BaseModel):
    receipt_no: str
    payment_date: datetime
    student: dict # { name, roll_no, school_class }
    school: dict # { name, address, phone }
    receipt_rows: List[ReceiptRow]
    mode_totals: dict # { Cash, UPI, Card, Scholarship }
    total_paid_this_receipt: float
    term_fee_breakdown: List[TermFeeBreakdownRow]
    term_total_fee: float
    term_total_paid: float
    term_total_balance: float

# Legacy/Dashboard Compatibility summary schemas
class StudentFeeRow(BaseModel):
    student_fee_assignment_item_id: int
    fee_structure_item_id: int
    term: str
    head_name: str
    amount: float
    waiver_amount: float
    late_fee_amount: float
    net_due: float
    paid: float
    balance: float
    status: str

class StudentFeeSummaryResponse(BaseModel):
    summary: List[StudentFeeRow]
    total_fee: float
    total_paid: float
    total_balance: float
    active_scholarship: Optional[dict] = None
    payment_history: Optional[List[dict]] = []
