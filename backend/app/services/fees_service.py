from sqlalchemy.orm import Session
from decimal import Decimal
from sqlalchemy import func, and_
from datetime import datetime
from fastapi import HTTPException, status
import random
from typing import List, Optional

from ..models.academic_year import AcademicYear
from ..models.term import Term
from ..models.fee_category import FeeCategory
from ..models.fee_structure import FeeStructure
from ..models.fee_payment import FeePayment
from ..models.scholarship import Scholarship
from ..models.scholarship_posting import ScholarshipPosting
from ..models.student import Student
from ..models.student_enrollment import StudentEnrollment

# ==========================================
# TERM / FEES SUMMARY SERVICES
# ==========================================

def get_student_fee_summary_data(db: Session, student_id: str, academic_year_id: int, term_id: int):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    enrollment = db.query(StudentEnrollment).filter_by(
        student_id=student_id,
        academic_year_id=academic_year_id
    ).first()
    school_class = enrollment.school_class if enrollment else student.class_
    
    structures = db.query(FeeStructure).filter_by(
        academic_year_id=academic_year_id,
        school_class=school_class,
        term_id=term_id
    ).order_by(FeeStructure.id.asc()).all()
    
    # Pre-calculate scholarship values to simulate pending allocation in the summary view
    total_schol_posted_query = db.query(func.sum(ScholarshipPosting.amount)).filter(
        ScholarshipPosting.student_id == student_id,
        ScholarshipPosting.academic_year_id == academic_year_id
    ).scalar()
    total_schol_posted = Decimal(total_schol_posted_query or 0)
    
    total_schol_applied_year_query = db.query(func.sum(FeePayment.amount_paid)).join(FeeStructure).filter(
        FeePayment.student_id == student_id,
        FeePayment.payment_mode == "Scholarship",
        FeeStructure.academic_year_id == academic_year_id
    ).scalar()
    total_schol_applied_year = Decimal(total_schol_applied_year_query or 0)
    
    remaining_scholarship = max(total_schol_posted - total_schol_applied_year, Decimal(0))
    temp_schol = remaining_scholarship
    
    fee_details = []
    grand_total = Decimal(0)
    total_paid = Decimal(0)
    total_scholarship_applied = Decimal(0)
    total_balance = Decimal(0)
    
    for fs in structures:
        # Sum of all payments for this structure item by student (EXCLUDING Scholarship)
        paid_query = db.query(func.sum(FeePayment.amount_paid)).filter(
            FeePayment.student_id == student_id,
            FeePayment.fee_structure_id == fs.id,
            FeePayment.payment_mode != "Scholarship"
        ).scalar()
        paid = Decimal(paid_query or 0)
        
        # Sum of scholarship payments for this structure item in database
        schol_applied_query = db.query(func.sum(FeePayment.amount_paid)).filter(
            FeePayment.student_id == student_id,
            FeePayment.fee_structure_id == fs.id,
            FeePayment.payment_mode == "Scholarship"
        ).scalar()
        schol_applied = Decimal(schol_applied_query or 0)
        
        fs_amount = Decimal(fs.amount)
        current_bal = max(fs_amount - paid - schol_applied, Decimal(0))
        
        # Simulate auto-applying the remaining scholarship to the balance shown
        sim_apply = Decimal(0)
        if temp_schol > 0 and current_bal > 0:
            sim_apply = min(current_bal, temp_schol)
            temp_schol -= sim_apply
            
        balance = max(current_bal - sim_apply, Decimal(0))
        display_schol_applied = schol_applied + sim_apply
        
        category = db.query(FeeCategory).filter(FeeCategory.category_id == fs.category_id).first()
        category_name = category.category_name if category else "Unknown"
        
        fee_details.append({
            "fee_structure_id": fs.id,
            "category_name": category_name,
            "total": float(fs_amount),
            "paid": float(paid),
            "scholarship_applied": float(display_schol_applied),
            "balance": float(balance)
        })
        
        grand_total += fs_amount
        total_paid += paid
        total_scholarship_applied += display_schol_applied
        total_balance += balance
        
    return {
        "student": {
            "id": student.student_id,
            "name": f"{student.first_name} {student.last_name}",
            "roll_no": student.roll_number,
            "school_class": student.class_
        },
        "fees": fee_details,
        "aggregates": {
            "grand_total": float(grand_total),
            "total_paid": float(total_paid),
            "total_scholarship_applied": float(total_scholarship_applied),
            "total_balance": float(total_balance),
            "total_scholarship_posted": float(total_schol_posted),
            "remaining_scholarship": float(remaining_scholarship)
        }
    }

# ==========================================
# PAYMENTS COLLECTION SERVICE
# ==========================================

def process_payment(
    db: Session,
    student_id: str,
    term_id: int,
    academic_year_id: int,
    cash_amount: float,
    upi_amount: float,
    card_amount: float
):
    cash_dec = Decimal(str(cash_amount))
    upi_dec = Decimal(str(upi_amount))
    card_dec = Decimal(str(card_amount))
    total_paying = cash_dec + upi_dec + card_dec
    if total_paying <= 0:
        raise HTTPException(status_code=400, detail="Enter a valid payment amount")
        
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    enrollment = db.query(StudentEnrollment).filter_by(
        student_id=student_id,
        academic_year_id=academic_year_id
    ).first()
    school_class = enrollment.school_class if enrollment else student.class_
    
    structures = db.query(FeeStructure).filter_by(
        academic_year_id=academic_year_id,
        school_class=school_class,
        term_id=term_id
    ).order_by(FeeStructure.id.asc()).all()
    
    if not structures:
        raise HTTPException(status_code=400, detail="No fee structures configured for this class/term")
        
    # Step 2: Compute current balance per structure and term balance (excluding Scholarship)
    balances = {}
    term_balance = Decimal(0)
    for fs in structures:
        # Sum of non-scholarship payments
        paid_query = db.query(func.sum(FeePayment.amount_paid)).filter(
            FeePayment.student_id == student_id,
            FeePayment.fee_structure_id == fs.id,
            FeePayment.payment_mode != "Scholarship"
        ).scalar()
        paid = Decimal(paid_query or 0)
        
        # Sum of scholarship payments
        schol_applied_query = db.query(func.sum(FeePayment.amount_paid)).filter(
            FeePayment.student_id == student_id,
            FeePayment.fee_structure_id == fs.id,
            FeePayment.payment_mode == "Scholarship"
        ).scalar()
        schol_applied = Decimal(schol_applied_query or 0)
        
        bal = max(Decimal(fs.amount) - paid - schol_applied, Decimal(0))
        balances[fs.id] = bal
        term_balance += bal
        
    # Step 3: Reject if paid up
    if term_balance <= 0:
        raise HTTPException(status_code=400, detail="All fees already paid for this term")
        
    # Step 4: Reject if payment exceeds balance
    if total_paying > term_balance:
        raise HTTPException(status_code=400, detail=f"Payment Rs. {float(total_paying):.2f} exceeds balance Rs. {float(term_balance):.2f}")
        
    # Step 7: Receipt No generation (generate before transactions)
    receipt_no = None
    for _ in range(5):
        hex_chars = "".join(random.choices("0123456789ABCDEF", k=8))
        candidate = f"RCPT-{hex_chars}"
        exists = db.query(FeePayment).filter(FeePayment.receipt_no == candidate).first()
        if not exists:
            receipt_no = candidate
            break
    if not receipt_no:
        raise HTTPException(status_code=500, detail="Failed to generate a unique receipt number")
        
    # Step 5: Scholarship auto-apply (runs before Cash/UPI/Card allocation)
    total_schol_posted_query = db.query(func.sum(ScholarshipPosting.amount)).filter(
        ScholarshipPosting.student_id == student_id,
        ScholarshipPosting.academic_year_id == academic_year_id
    ).scalar()
    total_schol_posted = Decimal(total_schol_posted_query or 0)
    
    total_schol_applied_query = db.query(func.sum(FeePayment.amount_paid)).join(FeeStructure).filter(
        FeePayment.student_id == student_id,
        FeePayment.payment_mode == "Scholarship",
        FeeStructure.academic_year_id == academic_year_id
    ).scalar()
    total_schol_applied = Decimal(total_schol_applied_query or 0)
    
    remaining_schol = max(total_schol_posted - total_schol_applied, Decimal(0))
    scholarship_applied_this_payment = Decimal(0)
    
    if remaining_schol > 0:
        for fs in structures:
            row_balance = balances[fs.id]
            if row_balance <= 0:
                continue
            apply = min(row_balance, remaining_schol)
            if apply > 0:
                pay_record = FeePayment(
                    receipt_no=receipt_no,
                    student_id=student_id,
                    fee_structure_id=fs.id,
                    amount_paid=apply,
                    payment_mode="Scholarship"
                )
                db.add(pay_record)
                remaining_schol -= apply
                scholarship_applied_this_payment += apply
                balances[fs.id] -= apply
                term_balance -= apply
            if remaining_schol <= 0:
                break
        # Flush changes so DB updates balances in loop
        db.flush()
            
    # Step 6: Allocate cash, UPI, card
    modes = [("Cash", cash_dec), ("UPI", upi_dec), ("Card", card_dec)]
    for mode_name, mode_val in modes:
        if mode_val <= 0:
            continue
        mode_remaining = mode_val
        for fs in structures:
            row_balance = balances[fs.id]
            if row_balance <= 0:
                continue
            alloc = min(row_balance, mode_remaining)
            if alloc > 0:
                pay_record = FeePayment(
                    receipt_no=receipt_no,
                    student_id=student_id,
                    fee_structure_id=fs.id,
                    amount_paid=alloc,
                    payment_mode=mode_name
                )
                db.add(pay_record)
                mode_remaining -= alloc
                balances[fs.id] -= alloc
                term_balance -= alloc
            if mode_remaining <= 0:
                break
                
    db.commit()
    
    # Calculate aggregates for response
    total_schol_posted_query = db.query(func.sum(ScholarshipPosting.amount)).filter(
        ScholarshipPosting.student_id == student_id,
        ScholarshipPosting.academic_year_id == academic_year_id
    ).scalar()
    total_schol_posted = Decimal(total_schol_posted_query or 0)
    
    total_schol_applied_year_query = db.query(func.sum(FeePayment.amount_paid)).join(FeeStructure).filter(
        FeePayment.student_id == student_id,
        FeePayment.payment_mode == "Scholarship",
        FeeStructure.academic_year_id == academic_year_id
    ).scalar()
    total_schol_applied_year = Decimal(total_schol_applied_year_query or 0)
    
    remaining_scholarship = max(total_schol_posted - total_schol_applied_year, Decimal(0))
    
    return {
        "success": True,
        "receipt_no": receipt_no,
        "total_paid_this_payment": float(total_paying),
        "term_balance_after": float(term_balance),
        "scholarship_applied_this_payment": float(scholarship_applied_this_payment),
        "remaining_scholarship": float(remaining_scholarship)
    }

# ==========================================
# RECEIPT PRINT / REPRINT SERVICES
# ==========================================

def get_fee_receipt(db: Session, receipt_no: str):
    payments = db.query(FeePayment).filter(FeePayment.receipt_no == receipt_no).all()
    if not payments:
        raise HTTPException(status_code=404, detail="Receipt not found")
        
    first_payment = payments[0]
    student = db.query(Student).filter(Student.student_id == first_payment.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    fs_ref = db.query(FeeStructure).filter(FeeStructure.id == first_payment.fee_structure_id).first()
    if not fs_ref:
        raise HTTPException(status_code=404, detail="Fee structure not found")
        
    # Get all categories paid in this receipt
    receipt_rows = []
    total_paid_this_receipt = Decimal(0)
    mode_totals = {"Cash": Decimal(0), "UPI": Decimal(0), "Card": Decimal(0), "Scholarship": Decimal(0)}
    
    for p in payments:
        cat = db.query(FeeCategory).filter(FeeCategory.category_id == p.fee_structure.category_id).first()
        cat_name = cat.category_name if cat else "Unknown"
        p_amount = Decimal(p.amount_paid)
        receipt_rows.append({
            "category_name": cat_name,
            "amount_paid": float(p_amount),
            "payment_mode": p.payment_mode
        })
        total_paid_this_receipt += p_amount
        if p.payment_mode in mode_totals:
            mode_totals[p.payment_mode] += p_amount
            
    # For full term breakdown
    term_structures = db.query(FeeStructure).filter_by(
        academic_year_id=fs_ref.academic_year_id,
        school_class=fs_ref.school_class,
        term_id=fs_ref.term_id
    ).all()
    
    term_fee_breakdown = []
    term_total_fee = Decimal(0)
    term_total_paid = Decimal(0)
    term_total_balance = Decimal(0)
    
    for fs in term_structures:
        p_query = db.query(func.sum(FeePayment.amount_paid)).filter(
            FeePayment.student_id == student.student_id,
            FeePayment.fee_structure_id == fs.id
        ).scalar()
        p_val = Decimal(p_query or 0)
        fs_amount = Decimal(fs.amount)
        bal = max(fs_amount - p_val, Decimal(0))
        
        cat = db.query(FeeCategory).filter(FeeCategory.category_id == fs.category_id).first()
        cat_name = cat.category_name if cat else "Unknown"
        
        term_fee_breakdown.append({
            "category_name": cat_name,
            "fee_total": float(fs_amount),
            "paid_total": float(p_val),
            "balance": float(bal)
        })
        
        term_total_fee += fs_amount
        term_total_paid += p_val
        term_total_balance += bal
        
    return {
        "receipt_no": receipt_no,
        "payment_date": first_payment.payment_date,
        "student": {
            "name": f"{student.first_name} {student.last_name}",
            "roll_no": student.roll_number,
            "school_class": student.class_
        },
        "school": {
            "name": "Green Park Matric Hr Sec School",
            "address": "Main Campus Road, Perambalur, Tamil Nadu",
            "phone": "+91 97860 40113"
        },
        "receipt_rows": receipt_rows,
        "mode_totals": {k: float(v) for k, v in mode_totals.items()},
        "total_paid_this_receipt": float(total_paid_this_receipt),
        "term_fee_breakdown": term_fee_breakdown,
        "term_total_fee": float(term_total_fee),
        "term_total_paid": float(term_total_paid),
        "term_total_balance": float(term_total_balance)
    }

# ==========================================
# BACKWARD COMPATIBILITY SUMMARY SERVICE
# ==========================================

def get_legacy_student_fee_summary(db: Session, student_id: str, academic_year_id: Optional[int] = None):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    if not academic_year_id:
        ay = db.query(AcademicYear).filter(AcademicYear.status == "ACTIVE").first()
        if not ay:
            ay = db.query(AcademicYear).first()
        if not ay:
            return {"summary": [], "total_fee": 0.0, "total_paid": 0.0, "total_balance": 0.0}
        academic_year_id = ay.year_id
        
    enrollment = db.query(StudentEnrollment).filter_by(
        student_id=student_id,
        academic_year_id=academic_year_id
    ).first()
    school_class = enrollment.school_class if enrollment else student.class_
    
    structures = db.query(FeeStructure).filter_by(
        academic_year_id=academic_year_id,
        school_class=school_class
    ).all()
    
    summary_list = []
    total_fee = Decimal(0)
    total_paid = Decimal(0)
    total_balance = Decimal(0)
    
    for fs in structures:
        # Sum of all payments for this structure item by student
        paid_query = db.query(func.sum(FeePayment.amount_paid)).filter(
            FeePayment.student_id == student_id,
            FeePayment.fee_structure_id == fs.id
        ).scalar()
        paid = Decimal(paid_query or 0)
        fs_amount = Decimal(fs.amount)
        balance = max(fs_amount - paid, Decimal(0))
        status_val = "Paid" if balance <= 0 else ("Partially Paid" if paid > 0 else "Pending")
        
        category = db.query(FeeCategory).filter(FeeCategory.category_id == fs.category_id).first()
        category_name = category.category_name if category else "Unknown"
        
        term = db.query(Term).filter(Term.term_id == fs.term_id).first()
        term_name = term.term_name if term else "Unknown"
        
        summary_list.append({
            "student_fee_assignment_item_id": fs.id,
            "fee_structure_item_id": fs.id,
            "term": term_name,
            "head_name": category_name,
            "amount": float(fs_amount),
            "waiver_amount": 0.0,
            "late_fee_amount": 0.0,
            "net_due": float(fs_amount),
            "paid": float(paid),
            "balance": float(balance),
            "status": status_val
        })
        
        total_fee += fs_amount
        total_paid += paid
        total_balance += balance
        
    # Get payments for transaction history
    payments = db.query(FeePayment).filter(FeePayment.student_id == student_id).all()
    history_map = {}
    for p in sorted(payments, key=lambda x: x.payment_date, reverse=True):
        if p.receipt_no not in history_map:
            history_map[p.receipt_no] = {
                "receipt_no": p.receipt_no,
                "amount": Decimal(0),
                "payment_mode": p.payment_mode,
                "collected_by": "Admin",
                "remarks": "Fee Payment Summary",
                "date": p.payment_date.strftime("%Y-%m-%d")
            }
        history_map[p.receipt_no]["amount"] += Decimal(p.amount_paid)
        
    # Format history amount to float
    for hist in history_map.values():
        hist["amount"] = float(hist["amount"])
        
    return {
        "summary": summary_list,
        "total_fee": float(total_fee),
        "total_paid": float(total_paid),
        "total_balance": float(total_balance),
        "active_scholarship": None,
        "payment_history": list(history_map.values())
    }
