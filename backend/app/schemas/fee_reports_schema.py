from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class FeePendingReportRow(BaseModel):
    student_name: str
    roll_no: Optional[str] = None
    school_class: str
    year_name: str
    term_name: str
    category_name: str
    total_fee: float
    paid: float
    pending: float

class FeePendingReportResponse(BaseModel):
    rows: List[FeePendingReportRow]
    total_pending: float

class FeePaymentReportRow(BaseModel):
    receipt_no: str
    payment_date: datetime
    student_name: str
    roll_no: Optional[str] = None
    school_class: str
    term_name: str
    category_name: str
    amount_paid: float
    payment_mode: str

class FeePaymentReportResponse(BaseModel):
    rows: List[FeePaymentReportRow]
    total_paid: float
    payment_modes_in_result: List[str]

class FeeCollectionDailyReportRow(BaseModel):
    receipt_no: str
    payment_date: datetime
    student_name: str
    roll_no: Optional[str] = None
    school_class: str
    term_name: str
    category_name: str
    amount_paid: float
    payment_mode: str

class DailyCollectionSummary(BaseModel):
    Cash: float
    UPI: float
    Card: float
    Scholarship: float
    grand_total: float

class FeeCollectionDailyReportResponse(BaseModel):
    rows: List[FeeCollectionDailyReportRow]
    summary: DailyCollectionSummary

class ScholarshipReportRow(BaseModel):
    student_name: str
    roll_no: Optional[str] = None
    school_class: str
    scholarship_name: str
    year_name: str
    amount: float

class ScholarshipReportResponse(BaseModel):
    rows: List[ScholarshipReportRow]
    total_scholarship: float
