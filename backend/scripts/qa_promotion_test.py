import os
import sys
from decimal import Decimal
import traceback

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

def run_promotion_qa():
    db = SessionLocal()
    report = {"passed": [], "failed": [], "warnings": []}
    
    try:
        print("Starting Student Promotion & Fee Integration QA Audit...")
        
        # Resolve active Academic Year
        ay = db.query(AcademicYear).filter(AcademicYear.status == "ACTIVE").first()
        if not ay:
            ay = db.query(AcademicYear).first()
        if not ay:
            print("ERROR: No Academic Year found in DB.")
            return

        term1 = db.query(Term).filter(Term.term_name.ilike("%Term 1%")).first()
        if not term1:
            print("ERROR: No Term 1 found in DB.")
            return

        # 1. Create student in LKG
        student_id = "PROM-QA-01"
        db.query(FeePayment).filter_by(student_id=student_id).delete()
        db.query(ScholarshipPosting).filter_by(student_id=student_id).delete()
        db.query(Student).filter_by(student_id=student_id).delete()
        db.commit()

        student = Student(
            student_id=student_id,
            admission_number="ADM-PROM-01",
            first_name="Promotion",
            last_name="TestStudent",
            roll_number="PROM01",
            class_="LKG",
            section="A",
            gender="Female"
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        print("Created student in LKG.")

        # 2. Get LKG Fee Structures and pay part of it
        lkg_structs = db.query(FeeStructure).filter_by(academic_year_id=ay.year_id, school_class="LKG", term_id=term1.term_id).all()
        lkg_total = sum([Decimal(fs.amount) for fs in lkg_structs])
        print(f"LKG total fee structure: Rs. {lkg_total}")

        if lkg_total == 0:
            report["failed"].append("No LKG fee structures configured.")
            return

        # Perform partial payment in LKG
        pay_res_lkg = fees_service.process_payment(db, student_id, term1.term_id, ay.year_id, 5000.0, 0.0, 0.0)
        print(f"Made LKG payment of Rs. 5000. Receipt: {pay_res_lkg['receipt_no']}")

        # 3. Simulate Promotion: Promote to UKG
        print("Promoting student to UKG...")
        student.class_ = "UKG"
        db.commit()
        db.refresh(student)

        # 4. Check payment history and LKG fee preservation
        lkg_payments = db.query(FeePayment).filter_by(student_id=student_id).all()
        if len(lkg_payments) > 0:
            report["passed"].append("Payment History: Previous payment records remain intact after promotion to UKG.")
        else:
            report["failed"].append("Payment History: Previous payments lost after promotion.")

        # Get summary for UKG (current class)
        ukg_summary = fees_service.get_student_fee_summary_data(db, student_id, ay.year_id, term1.term_id)
        ukg_total = sum([Decimal(fs["total"]) for fs in ukg_summary["fees"]])
        print(f"UKG total fee structure for promoted student: Rs. {ukg_total}")

        # Check that old LKG payments do NOT reduce UKG balance automatically (as they are LKG payments)
        ukg_bal = Decimal(str(ukg_summary["aggregates"]["total_balance"]))
        if ukg_bal == ukg_total:
            report["passed"].append("Fee Assignment: Student correctly received UKG structures and LKG payment did not pollute UKG balance.")
        else:
            report["failed"].append(f"Fee Assignment: UKG balance mismatch. Expected {ukg_total}, got {ukg_bal}")

        # 5. Pay UKG Fee
        pay_res_ukg = fees_service.process_payment(db, student_id, term1.term_id, ay.year_id, 8000.0, 0.0, 0.0)
        print(f"Made UKG payment of Rs. 8000. Receipt: {pay_res_ukg['receipt_no']}")

        # Verify receipt history lists both LKG and UKG receipts
        legacy_summary = fees_service.get_legacy_student_fee_summary(db, student_id, ay.year_id)
        history_receipts = [h["receipt_no"] for h in legacy_summary["payment_history"]]
        if pay_res_lkg['receipt_no'] in history_receipts and pay_res_ukg['receipt_no'] in history_receipts:
            report["passed"].append("Reports: Payment History lists all receipts across different classes (LKG & UKG).")
        else:
            report["failed"].append("Reports: Payment History missed receipts from previous classes.")

        # 6. Simulate Promotion to Class I
        print("Promoting student to Class I...")
        student.class_ = "1"
        db.commit()
        db.refresh(student)

        class1_summary = fees_service.get_student_fee_summary_data(db, student_id, ay.year_id, term1.term_id)
        class1_total = sum([Decimal(fs["total"]) for fs in class1_summary["fees"]])
        print(f"Class I total fee structure: Rs. {class1_total}")

        # Clean up database
        db.query(FeePayment).filter_by(student_id=student_id).delete()
        db.query(Student).filter_by(student_id=student_id).delete()
        db.commit()
        print("Cleanup done.")

    except Exception as e:
        report["failed"].append(f"Promotion Test Failed: {str(e)}")
        traceback.print_exc()

    print("\n" + "="*50)
    print("PROMOTION & INTEGRATION QA RESULTS")
    print("="*50)
    print("PASSED TESTS:")
    for m in report["passed"]: print(f" [PASS] {m}")
    print("\nFAILED TESTS:")
    for m in report["failed"]: print(f" [FAIL] {m}")
    print("="*50)

if __name__ == "__main__":
    run_promotion_qa()
