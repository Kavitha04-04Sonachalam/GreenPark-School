from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ...core.database import get_db
from ...models.student import Student
from ...models.fee_structure import FeeStructure
from ...models.term import Term
from ...schemas import fees_schema
from ...services import fees_service
from ...api.deps import get_current_user, get_current_admin_user

router = APIRouter()

# GET /fee-payment/students
@router.get("/fee-payment/students", response_model=List[fees_schema.FeePaymentStudent])
def get_students_for_payment(
    academic_year_id: int,
    school_class: str,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    from ...models.student_enrollment import StudentEnrollment
    students = db.query(Student, StudentEnrollment).join(
        StudentEnrollment, Student.student_id == StudentEnrollment.student_id
    ).filter(
        StudentEnrollment.academic_year_id == academic_year_id,
        StudentEnrollment.school_class == school_class
    ).all()
    
    formatted = []
    for s, enrollment in students:
        formatted.append(fees_schema.FeePaymentStudent(
            id=s.student_id,
            name=f"{s.first_name} {s.last_name}",
            roll_no=enrollment.roll_number or s.roll_number,
            school_class=enrollment.school_class
        ))
    return formatted

# GET /fee-payment/student/{student_id}/terms
@router.get("/fee-payment/student/{student_id}/terms", response_model=List[fees_schema.FeePaymentTerm])
def get_student_terms(
    student_id: str,
    academic_year_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    from ...models.student_enrollment import StudentEnrollment
    enrollment = db.query(StudentEnrollment).filter_by(
        student_id=student_id,
        academic_year_id=academic_year_id
    ).first()
    school_class = enrollment.school_class if enrollment else student.class_
    
    term_ids = db.query(FeeStructure.term_id).filter_by(
        academic_year_id=academic_year_id,
        school_class=school_class
    ).distinct().all()
    
    term_ids = [t[0] for t in term_ids]
    
    terms = db.query(Term).filter(Term.term_id.in_(term_ids)).order_by(Term.term_id.asc()).all()
    return [fees_schema.FeePaymentTerm(term_id=t.term_id, term_name=t.term_name) for t in terms]

# GET /fee-payment/student/{student_id}/fees
@router.get("/fee-payment/student/{student_id}/fees", response_model=fees_schema.StudentFeeDetailsResponse)
def get_student_fees(
    student_id: str,
    academic_year_id: int,
    term_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    return fees_service.get_student_fee_summary_data(db, student_id, academic_year_id, term_id)

# POST /fee-payment/pay
@router.post("/fee-payment/pay", response_model=fees_schema.PayFeeResponse)
def collect_fees(
    req: fees_schema.PayFeeRequest,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    return fees_service.process_payment(
        db,
        student_id=req.student_id,
        term_id=req.term_id,
        academic_year_id=req.academic_year_id,
        cash_amount=req.cash_amount,
        upi_amount=req.upi_amount,
        card_amount=req.card_amount
    )

# GET /fee-payment/receipt/{receipt_no}
@router.get("/fee-payment/receipt/{receipt_no}", response_model=fees_schema.FeeReceiptResponse)
def get_receipt(
    receipt_no: str,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    return fees_service.get_fee_receipt(db, receipt_no)

# ----------------- BACKWARD COMPATIBILITY ENDPOINTS -----------------
# GET /fees/student/{student_id}/summary (Parent/Student summary view)
@router.get("/fees/student/{student_id}/summary", response_model=fees_schema.StudentFeeSummaryResponse)
def get_student_legacy_summary(
    student_id: str,
    academic_year_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    # Enforce parent/student/admin checks
    if user.role == "parent":
        # Check parent has access to student
        student = db.query(Student).filter(Student.student_id == student_id).first()
        if not student or student.parent_id != user.parent_id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif user.role == "student":
        if user.student_id != student_id:
            raise HTTPException(status_code=403, detail="Access denied")
            
    return fees_service.get_legacy_student_fee_summary(db, student_id, academic_year_id)

# GET /fees/receipt/{receipt_no} (Reprint receipt)
@router.get("/fees/receipt/{receipt_no}", response_model=fees_schema.FeeReceiptResponse)
def get_legacy_receipt(
    receipt_no: str,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    receipt = fees_service.get_fee_receipt(db, receipt_no)
    
    if user.role == "parent":
        student = db.query(Student).filter(
            (Student.first_name + " " + Student.last_name) == receipt["student"]["name"]
        ).first()
        if not student or student.parent_id != user.parent_id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif user.role == "student":
        student = db.query(Student).filter(Student.student_id == user.student_id).first()
        if not student or f"{student.first_name} {student.last_name}" != receipt["student"]["name"]:
            raise HTTPException(status_code=403, detail="Access denied")
            
    return receipt
