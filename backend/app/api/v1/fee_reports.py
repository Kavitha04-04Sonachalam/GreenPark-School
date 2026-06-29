from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from decimal import Decimal
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from typing import List, Optional
from ...core.database import get_db
from ...models.student import Student
from ...models.student_enrollment import StudentEnrollment
from ...models.fee_structure import FeeStructure
from ...models.fee_payment import FeePayment
from ...models.academic_year import AcademicYear
from ...models.term import Term
from ...models.fee_category import FeeCategory
from ...models.scholarship import Scholarship
from ...models.scholarship_posting import ScholarshipPosting
from ...schemas import fee_reports_schema
from ...api.deps import get_current_admin_user

router = APIRouter()

@router.get("/reports/fees-pending", response_model=fee_reports_schema.FeePendingReportResponse)
def get_pending_fees_report(
    academic_year_id: int,
    school_class: Optional[str] = None,
    term_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    # Fetch academic year name
    ay = db.query(AcademicYear).filter(AcademicYear.year_id == academic_year_id).first()
    if not ay:
        raise HTTPException(status_code=404, detail="Academic year not found")
        
    # Get students matching class filter via StudentEnrollment
    student_query = db.query(Student, StudentEnrollment).join(
        StudentEnrollment, Student.student_id == StudentEnrollment.student_id
    ).filter(StudentEnrollment.academic_year_id == academic_year_id)
    
    if school_class:
        student_query = student_query.filter(StudentEnrollment.school_class == school_class)
    students_with_enrollment = student_query.all()
    
    rows = []
    total_pending_sum = Decimal(0)
    
    for student, enrollment in students_with_enrollment:
        school_class_val = enrollment.school_class
        roll_no_val = enrollment.roll_number or student.roll_number
        
        # Fetch fee structures matching student's class and active year
        struct_query = db.query(
            FeeStructure.id,
            FeeStructure.amount,
            Term.term_name.label("term_name"),
            FeeCategory.category_name.label("category_name")
        ).join(Term, FeeStructure.term_id == Term.term_id)\
         .join(FeeCategory, FeeStructure.category_id == FeeCategory.category_id)\
         .filter(FeeStructure.academic_year_id == academic_year_id, FeeStructure.school_class == school_class_val)
         
        if term_id is not None:
            struct_query = struct_query.filter(FeeStructure.term_id == term_id)
            
        structures = struct_query.all()
        
        for struct in structures:
            # Calculate total paid by this student for this fee structure
            paid_query = db.query(func.sum(FeePayment.amount_paid)).filter(
                FeePayment.student_id == student.student_id,
                FeePayment.fee_structure_id == struct.id
            ).scalar()
            paid = Decimal(paid_query or 0)
            struct_amount = Decimal(struct.amount)
            pending = max(struct_amount - paid, Decimal(0))
            
            if pending > 0:
                rows.append(fee_reports_schema.FeePendingReportRow(
                    student_name=f"{student.first_name} {student.last_name}",
                    roll_no=roll_no_val,
                    school_class=school_class_val,
                    year_name=ay.year_name,
                    term_name=struct.term_name,
                    category_name=struct.category_name,
                    total_fee=float(struct_amount),
                    paid=float(paid),
                    pending=float(pending)
                ))
                total_pending_sum += pending
                
    return fee_reports_schema.FeePendingReportResponse(
        rows=rows,
        total_pending=float(total_pending_sum)
    )

@router.get("/reports/fees-payment", response_model=fee_reports_schema.FeePaymentReportResponse)
def get_payment_report(
    academic_year_id: int,
    school_class: Optional[str] = None,
    term_id: Optional[int] = None,
    payment_mode: Optional[str] = None,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    query = db.query(
        FeePayment.receipt_no,
        FeePayment.payment_date,
        FeePayment.amount_paid,
        FeePayment.payment_mode,
        (Student.first_name + " " + Student.last_name).label("student_name"),
        func.coalesce(StudentEnrollment.roll_number, Student.roll_number).label("roll_no"),
        func.coalesce(StudentEnrollment.school_class, Student.class_).label("school_class"),
        Term.term_name.label("term_name"),
        FeeCategory.category_name.label("category_name"),
        FeeStructure.academic_year_id
    ).join(Student, FeePayment.student_id == Student.student_id)\
     .join(FeeStructure, FeePayment.fee_structure_id == FeeStructure.id)\
     .outerjoin(
         StudentEnrollment,
         and_(
             StudentEnrollment.student_id == Student.student_id,
             StudentEnrollment.academic_year_id == FeeStructure.academic_year_id
         )
     )\
     .join(Term, FeeStructure.term_id == Term.term_id)\
     .join(FeeCategory, FeeStructure.category_id == FeeCategory.category_id)\
     .filter(FeeStructure.academic_year_id == academic_year_id)
     
    if school_class:
        query = query.filter(func.coalesce(StudentEnrollment.school_class, Student.class_) == school_class)
    if term_id is not None:
        query = query.filter(FeeStructure.term_id == term_id)
    if payment_mode:
        query = query.filter(FeePayment.payment_mode == payment_mode)
        
    results = query.order_by(FeePayment.payment_date.desc()).all()
    
    rows = []
    total_paid_sum = Decimal(0)
    distinct_modes = set()
    
    for r in results:
        distinct_modes.add(r.payment_mode)
        amt_paid = Decimal(r.amount_paid)
        rows.append(fee_reports_schema.FeePaymentReportRow(
            receipt_no=r.receipt_no,
            payment_date=r.payment_date,
            student_name=r.student_name,
            roll_no=r.roll_no,
            school_class=r.school_class,
            term_name=r.term_name,
            category_name=r.category_name,
            amount_paid=float(amt_paid),
            payment_mode=r.payment_mode
        ))
        total_paid_sum += amt_paid
        
    return fee_reports_schema.FeePaymentReportResponse(
        rows=rows,
        total_paid=float(total_paid_sum),
        payment_modes_in_result=list(distinct_modes)
    )

@router.get("/reports/fees-collection-daily", response_model=fee_reports_schema.FeeCollectionDailyReportResponse)
def get_daily_collection_report(
    date: str, # YYYY-MM-DD
    payment_mode: Optional[str] = None,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
    query = db.query(
        FeePayment.receipt_no,
        FeePayment.payment_date,
        FeePayment.amount_paid,
        FeePayment.payment_mode,
        (Student.first_name + " " + Student.last_name).label("student_name"),
        func.coalesce(StudentEnrollment.roll_number, Student.roll_number).label("roll_no"),
        func.coalesce(StudentEnrollment.school_class, Student.class_).label("school_class"),
        Term.term_name.label("term_name"),
        FeeCategory.category_name.label("category_name")
    ).join(Student, FeePayment.student_id == Student.student_id)\
     .join(FeeStructure, FeePayment.fee_structure_id == FeeStructure.id)\
     .outerjoin(
         StudentEnrollment,
         and_(
             StudentEnrollment.student_id == Student.student_id,
             StudentEnrollment.academic_year_id == FeeStructure.academic_year_id
         )
     )\
     .join(Term, FeeStructure.term_id == Term.term_id)\
     .join(FeeCategory, FeeStructure.category_id == FeeCategory.category_id)\
     .filter(func.date(FeePayment.payment_date) == target_date)
     
    if payment_mode:
        query = query.filter(FeePayment.payment_mode == payment_mode)
        
    results = query.order_by(FeePayment.payment_date.desc()).all()
    
    rows = []
    summary_modes = {"Cash": Decimal(0), "UPI": Decimal(0), "Card": Decimal(0), "Scholarship": Decimal(0)}
    
    for r in results:
        amt_paid = Decimal(r.amount_paid)
        rows.append(fee_reports_schema.FeeCollectionDailyReportRow(
            receipt_no=r.receipt_no,
            payment_date=r.payment_date,
            student_name=r.student_name,
            roll_no=r.roll_no,
            school_class=r.school_class,
            term_name=r.term_name,
            category_name=r.category_name,
            amount_paid=float(amt_paid),
            payment_mode=r.payment_mode
        ))
        if r.payment_mode in summary_modes:
            summary_modes[r.payment_mode] += amt_paid
            
    grand_total = sum(summary_modes.values())
    
    return fee_reports_schema.FeeCollectionDailyReportResponse(
        rows=rows,
        summary=fee_reports_schema.DailyCollectionSummary(
            Cash=float(summary_modes["Cash"]),
            UPI=float(summary_modes["UPI"]),
            Card=float(summary_modes["Card"]),
            Scholarship=float(summary_modes["Scholarship"]),
            grand_total=float(grand_total)
        )
    )

@router.get("/reports/fees-collection-range", response_model=fee_reports_schema.FeeCollectionDailyReportResponse)
def get_range_collection_report(
    start_date: str, # YYYY-MM-DD
    end_date: str, # YYYY-MM-DD
    payment_mode: Optional[str] = None,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    try:
        s_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        e_date = datetime.strptime(end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
    next_day = e_date + timedelta(days=1)
    
    query = db.query(
        FeePayment.receipt_no,
        FeePayment.payment_date,
        FeePayment.amount_paid,
        FeePayment.payment_mode,
        (Student.first_name + " " + Student.last_name).label("student_name"),
        func.coalesce(StudentEnrollment.roll_number, Student.roll_number).label("roll_no"),
        func.coalesce(StudentEnrollment.school_class, Student.class_).label("school_class"),
        Term.term_name.label("term_name"),
        FeeCategory.category_name.label("category_name")
    ).join(Student, FeePayment.student_id == Student.student_id)\
     .join(FeeStructure, FeePayment.fee_structure_id == FeeStructure.id)\
     .outerjoin(
         StudentEnrollment,
         and_(
             StudentEnrollment.student_id == Student.student_id,
             StudentEnrollment.academic_year_id == FeeStructure.academic_year_id
         )
     )\
     .join(Term, FeeStructure.term_id == Term.term_id)\
     .join(FeeCategory, FeeStructure.category_id == FeeCategory.category_id)\
     .filter(FeePayment.payment_date >= s_date, FeePayment.payment_date < next_day)
     
    if payment_mode:
        query = query.filter(FeePayment.payment_mode == payment_mode)
        
    results = query.order_by(FeePayment.payment_date.desc()).all()
    
    rows = []
    summary_modes = {"Cash": Decimal(0), "UPI": Decimal(0), "Card": Decimal(0), "Scholarship": Decimal(0)}
    
    for r in results:
        amt_paid = Decimal(r.amount_paid)
        rows.append(fee_reports_schema.FeeCollectionDailyReportRow(
            receipt_no=r.receipt_no,
            payment_date=r.payment_date,
            student_name=r.student_name,
            roll_no=r.roll_no,
            school_class=r.school_class,
            term_name=r.term_name,
            category_name=r.category_name,
            amount_paid=float(amt_paid),
            payment_mode=r.payment_mode
        ))
        if r.payment_mode in summary_modes:
            summary_modes[r.payment_mode] += amt_paid
            
    grand_total = sum(summary_modes.values())
    
    return fee_reports_schema.FeeCollectionDailyReportResponse(
        rows=rows,
        summary=fee_reports_schema.DailyCollectionSummary(
            Cash=float(summary_modes["Cash"]),
            UPI=float(summary_modes["UPI"]),
            Card=float(summary_modes["Card"]),
            Scholarship=float(summary_modes["Scholarship"]),
            grand_total=float(grand_total)
        )
    )

@router.get("/reports/scholarships", response_model=fee_reports_schema.ScholarshipReportResponse)
def get_scholarships_report(
    academic_year_id: Optional[int] = None,
    school_class: Optional[str] = None,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    query = db.query(
        ScholarshipPosting.amount,
        (Student.first_name + " " + Student.last_name).label("student_name"),
        func.coalesce(StudentEnrollment.roll_number, Student.roll_number).label("roll_no"),
        func.coalesce(StudentEnrollment.school_class, Student.class_).label("school_class"),
        Scholarship.name.label("scholarship_name"),
        AcademicYear.year_name.label("year_name")
    ).join(Student, ScholarshipPosting.student_id == Student.student_id)\
     .join(Scholarship, ScholarshipPosting.scholarship_id == Scholarship.id)\
     .join(AcademicYear, ScholarshipPosting.academic_year_id == AcademicYear.year_id)\
     .outerjoin(
         StudentEnrollment,
         and_(
             StudentEnrollment.student_id == Student.student_id,
             StudentEnrollment.academic_year_id == ScholarshipPosting.academic_year_id
         )
     )
     
    if academic_year_id is not None:
        query = query.filter(ScholarshipPosting.academic_year_id == academic_year_id)
    if school_class:
        query = query.filter(func.coalesce(StudentEnrollment.school_class, Student.class_) == school_class)
        
    results = query.order_by(ScholarshipPosting.id.desc()).all()
    
    rows = []
    total_scholarship_sum = Decimal(0)
    
    for r in results:
        amt = Decimal(r.amount)
        rows.append(fee_reports_schema.ScholarshipReportRow(
            student_name=r.student_name,
            roll_no=r.roll_no,
            school_class=r.school_class,
            scholarship_name=r.scholarship_name,
            year_name=r.year_name,
            amount=float(amt)
        ))
        total_scholarship_sum += amt
        
    return fee_reports_schema.ScholarshipReportResponse(
        rows=rows,
        total_scholarship=float(total_scholarship_sum)
    )
