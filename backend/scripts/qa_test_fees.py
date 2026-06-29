import os
import sys
from decimal import Decimal
import traceback

# Add the backend directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.student import Student
from app.models.academic_year import AcademicYear
from app.models.term import Term
from app.models.fee_category import FeeCategory
from app.models.fee_structure import FeeStructure
from app.models.fee_payment import FeePayment
from app.models.scholarship import Scholarship
from app.models.scholarship_posting import ScholarshipPosting
from app.services import fees_service

def run_qa():
    db = SessionLocal()
    report = {"passed": [], "failed": [], "warnings": []}
    
    try:
        # 1. Fee Structure Validation
        print("Running Fee Structure Validation...")
        ay = db.query(AcademicYear).filter(AcademicYear.status == "ACTIVE").first()
        if not ay:
            ay = db.query(AcademicYear).first()
            
        classes = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
        expected_amounts = {
            'LKG': 27000, 'UKG': 28000, '1': 29000, '2': 30000, '3': 31000, '4': 32000,
            '5': 33000, '6': 34000, '7': 35000, '8': 36000, '9': 37000, '10': 38000,
            '11': 39000, '12': 40000
        }
        
        all_correct = True
        for cls, expected in expected_amounts.items():
            structures = db.query(FeeStructure).filter_by(academic_year_id=ay.year_id, school_class=cls).all()
            total_fee = sum([float(fs.amount) for fs in structures])
            if total_fee != expected:
                report["failed"].append(f"Fee Structure: Class {cls} total is {total_fee}, expected {expected}")
                all_correct = False
                
        if all_correct:
            report["passed"].append("Fee Structure: All class totals match expected progression (27k to 40k).")
            
        # 2. Setup a Dummy Student for Payments QA
        student = db.query(Student).filter_by(first_name="QA", last_name="Test").first()
        if not student:
            student = Student(
                student_id="QA-001",
                admission_number="ADM-QA-001",
                first_name="QA",
                last_name="Test",
                roll_number="QA123",
                class_="1",
                section="A",
                gender="Male"
            )
            db.add(student)
            db.commit()
            db.refresh(student)
            
        student_id = student.student_id
        term1 = db.query(Term).filter(Term.term_name.ilike("%Term 1%")).first()
        
        # Clean previous payments and scholarships for QA student
        db.query(FeePayment).filter_by(student_id=student_id).delete()
        db.query(ScholarshipPosting).filter_by(student_id=student_id).delete()
        db.commit()
        
        # 3. Payment Validation: Partial Payment
        print("Running Partial Payment Validation...")
        term1_structs = db.query(FeeStructure).filter_by(academic_year_id=ay.year_id, school_class="1", term_id=term1.term_id).all()
        term1_total = sum([float(fs.amount) for fs in term1_structs])
        
        if term1_total <= 0:
            report["failed"].append("No structures found for Class 1 Term 1. Cannot test payments.")
        else:
            try:
                res1 = fees_service.process_payment(db, student_id, term1.term_id, ay.year_id, 1000.0, 0.0, 0.0)
                if res1["total_paid_this_payment"] == 1000.0 and res1["term_balance_after"] == (term1_total - 1000.0):
                    report["passed"].append("Payment: Partial payment of Rs.1000 succeeded and balance correctly reduced.")
                else:
                    report["failed"].append(f"Payment: Partial payment balance incorrect. Expected {term1_total - 1000}, got {res1['term_balance_after']}")
            except Exception as e:
                report["failed"].append(f"Payment: Partial payment failed - {str(e)}")
                
            # Payment Validation: Overpayment
            print("Running Overpayment Validation...")
            try:
                fees_service.process_payment(db, student_id, term1.term_id, ay.year_id, 999999.0, 0.0, 0.0)
                report["failed"].append("Payment: Overpayment was allowed but should have been rejected!")
            except Exception as e:
                if "exceeds balance" in str(e):
                    report["passed"].append("Payment: Overpayment was correctly blocked with error.")
                else:
                    report["failed"].append(f"Payment: Overpayment failed with unexpected error - {str(e)}")
                    
            # 4. Scholarship Validation
            print("Running Scholarship Validation...")
            schol = db.query(Scholarship).filter_by(name="Merit QA").first()
            if not schol:
                schol = Scholarship(name="Merit QA")
                db.add(schol)
                db.commit()
                db.refresh(schol)
                
            posting = ScholarshipPosting(
                scholarship_id=schol.id,
                student_id=student_id,
                academic_year_id=ay.year_id,
                amount=2000.0
            )
            db.add(posting)
            db.commit()
            
            try:
                # Scholarship should auto-apply on next payment
                res2 = fees_service.process_payment(db, student_id, term1.term_id, ay.year_id, 500.0, 0.0, 0.0)
                if res2["scholarship_applied_this_payment"] == 2000.0:
                    report["passed"].append("Scholarship: Auto-applied fully on next payment.")
                else:
                    report["failed"].append(f"Scholarship: Auto-apply amount incorrect. Got {res2['scholarship_applied_this_payment']}")
                    
                # Verify Summary double-counting
                summary = fees_service.get_student_fee_summary_data(db, student_id, ay.year_id, term1.term_id)
                agg = summary["aggregates"]
                expected_total_paid = 1500.0  # 1000 + 500
                expected_schol = 2000.0
                if agg["total_paid"] == expected_total_paid and agg["total_scholarship_applied"] == expected_schol:
                    report["passed"].append("Scholarship: Paid and Scholarship applied are correctly separated in summary (no double counting).")
                else:
                    report["failed"].append(f"Scholarship: Double counting or aggregation issue! Paid: {agg['total_paid']}, Schol: {agg['total_scholarship_applied']}")
                    
                # Verify formula: Total Fee = Paid + Scholarship + Balance
                calc_total = agg["total_paid"] + agg["total_scholarship_applied"] + agg["total_balance"]
                if round(calc_total, 2) == round(agg["grand_total"], 2):
                    report["passed"].append("Scholarship: Formula (Total = Paid + Scholarship + Balance) holds true.")
                else:
                    report["failed"].append(f"Scholarship: Formula broken. Grand={agg['grand_total']}, Calc={calc_total}")
                    
            except Exception as e:
                report["failed"].append(f"Scholarship: Workflow failed - {str(e)}")
                traceback.print_exc()

    except Exception as e:
        report["failed"].append(f"CRITICAL ERROR: {str(e)}")
        traceback.print_exc()
        
    print("\n" + "="*50)
    print("QA REPORT")
    print("="*50)
    print("PASSED TESTS:")
    for m in report["passed"]: print(f" [PASS] {m}")
    print("\nFAILED TESTS:")
    for m in report["failed"]: print(f" [FAIL] {m}")
    print("\nWARNINGS:")
    for m in report["warnings"]: print(f" [WARN] {m}")
    print("="*50)

if __name__ == "__main__":
    run_qa()
