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
from app.models.student_enrollment import StudentEnrollment
from app.services import admin_service, fees_service
from app.api.v1 import fee_reports

def run_qa_enrollment_history():
    db = SessionLocal()
    report = {"passed": [], "failed": []}
    
    # Track original state to restore
    original_active_ay_id = None
    created_student_id = "HIST-QA-01"
    
    try:
        print("Starting QA Enrollment History & Promotion Integration Test...")
        
        from datetime import date
        # 1. Setup/Verify Academic Years: 2024-2025, 2025-2026, 2026-2027
        years_info = {
            "2024-2025": (date(2024, 6, 1), date(2025, 5, 31)),
            "2025-2026": (date(2025, 6, 1), date(2026, 5, 31)),
            "2026-2027": (date(2026, 6, 1), date(2027, 5, 31))
        }
        years = {}
        for y_name, (start_d, end_d) in years_info.items():
            ay = db.query(AcademicYear).filter(AcademicYear.year_name == y_name).first()
            if not ay:
                ay = AcademicYear(
                    year_name=y_name,
                    start_date=start_d,
                    end_date=end_d,
                    status="INACTIVE"
                )
                db.add(ay)
                db.commit()
                db.refresh(ay)
                print(f" [+] Created Academic Year: {y_name}")
            years[y_name] = ay
            
        # Record the currently active academic year to restore later
        active_ay = db.query(AcademicYear).filter(AcademicYear.status == "ACTIVE").first()
        if active_ay:
            original_active_ay_id = active_ay.year_id
            
        # 2. Setup/Verify Term and Fee Category
        term1 = db.query(Term).filter(Term.term_name == "Term 1").first()
        if not term1:
            term1 = Term(term_name="Term 1")
            db.add(term1)
            db.commit()
            db.refresh(term1)
            print(" [+] Created Term 1")
            
        cat_course = db.query(FeeCategory).filter(FeeCategory.category_name == "Course Fee").first()
        if not cat_course:
            cat_course = FeeCategory(category_name="Course Fee")
            db.add(cat_course)
            db.commit()
            db.refresh(cat_course)
            print(" [+] Created Category Course Fee")
            
        # 3. Setup Fee Structures if none exist
        # 2024-2025 LKG: 27000
        lkg_structs = db.query(FeeStructure).filter_by(
            academic_year_id=years["2024-2025"].year_id,
            school_class="LKG",
            term_id=term1.term_id
        ).all()
        if not lkg_structs:
            lkg_struct = FeeStructure(
                academic_year_id=years["2024-2025"].year_id,
                school_class="LKG",
                term_id=term1.term_id,
                category_id=cat_course.category_id,
                amount=27000.0
            )
            db.add(lkg_struct)
            db.commit()
            lkg_total = Decimal("27000.0")
            print(" [+] Created Fee Structure: 2024-2025 LKG = 27000")
        else:
            lkg_total = sum(Decimal(str(fs.amount)) for fs in lkg_structs)
            
        # 2025-2026 UKG: 28000
        ukg_structs = db.query(FeeStructure).filter_by(
            academic_year_id=years["2025-2026"].year_id,
            school_class="UKG",
            term_id=term1.term_id
        ).all()
        if not ukg_structs:
            ukg_struct = FeeStructure(
                academic_year_id=years["2025-2026"].year_id,
                school_class="UKG",
                term_id=term1.term_id,
                category_id=cat_course.category_id,
                amount=28000.0
            )
            db.add(ukg_struct)
            db.commit()
            ukg_total = Decimal("28000.0")
            print(" [+] Created Fee Structure: 2025-2026 UKG = 28000")
        else:
            ukg_total = sum(Decimal(str(fs.amount)) for fs in ukg_structs)
            
        # 2026-2027 Class 1 ("1"): 29000
        class1_structs = db.query(FeeStructure).filter_by(
            academic_year_id=years["2026-2027"].year_id,
            school_class="1",
            term_id=term1.term_id
        ).all()
        if not class1_structs:
            class1_struct = FeeStructure(
                academic_year_id=years["2026-2027"].year_id,
                school_class="1",
                term_id=term1.term_id,
                category_id=cat_course.category_id,
                amount=29000.0
            )
            db.add(class1_struct)
            db.commit()
            class1_total = Decimal("29000.0")
            print(" [+] Created Fee Structure: 2026-2027 Class 1 = 29000")
        else:
            class1_total = sum(Decimal(str(fs.amount)) for fs in class1_structs)
            
        print(f" [+] Resolved Totals: LKG = {lkg_total}, UKG = {ukg_total}, Class 1 = {class1_total}")
        
        # 4. Clean up any existing test records for HIST-QA-01
        db.query(FeePayment).filter_by(student_id=created_student_id).delete()
        db.query(StudentEnrollment).filter_by(student_id=created_student_id).delete()
        db.query(Student).filter_by(student_id=created_student_id).delete()
        db.commit()
        
        # 5. Set 2024-2025 as Active Year and create student in LKG
        db.query(AcademicYear).update({AcademicYear.status: "INACTIVE"})
        years["2024-2025"].status = "ACTIVE"
        db.commit()
        
        student_data = {
            "student_id": created_student_id,
            "admission_number": "ADM-HIST-01",
            "first_name": "History",
            "last_name": "QA-Student",
            "roll_number": "HIST101",
            "class_": "LKG",
            "section": "A",
            "gender": "Male"
        }
        
        student = admin_service.create_student(db, student_data)
        print(" [+] Created student in LKG (Academic Year 2024-2025).")
        
        # Verify enrollment for 2024-2025 is created and is Active
        enrollment_2425 = db.query(StudentEnrollment).filter_by(
            student_id=created_student_id,
            academic_year_id=years["2024-2025"].year_id
        ).first()
        
        if enrollment_2425 and enrollment_2425.status == "Active" and enrollment_2425.school_class == "LKG":
            report["passed"].append("1. Student enrollment created correctly on student creation.")
        else:
            report["failed"].append("1. Student enrollment missing or incorrect on student creation.")
            
        # 6. Verify Fee structure and make partial payment in LKG
        summary_2425 = fees_service.get_student_fee_summary_data(
            db, created_student_id, years["2024-2025"].year_id, term1.term_id
        )
        bal_2425 = Decimal(str(summary_2425["aggregates"]["total_balance"]))
        if bal_2425 == lkg_total:
            report["passed"].append(f"2. LKG fee structure resolved correctly for 2024-2025 (Rs. {lkg_total}).")
        else:
            report["failed"].append(f"2. LKG fee structure wrong. Expected {lkg_total}, got {bal_2425}")
            
        # Make a payment of 5000 in LKG
        pay_amt_2425 = min(Decimal("5000.0"), lkg_total)
        pay_res_2425 = fees_service.process_payment(
            db, created_student_id, term1.term_id, years["2024-2025"].year_id, float(pay_amt_2425), 0.0, 0.0
        )
        print(f" [+] Made LKG payment of Rs. {pay_amt_2425}. Receipt: {pay_res_2425['receipt_no']}")
        
        summary_2425_after = fees_service.get_student_fee_summary_data(
            db, created_student_id, years["2024-2025"].year_id, term1.term_id
        )
        bal_2425_after = Decimal(str(summary_2425_after["aggregates"]["total_balance"]))
        expected_bal_2425_after = lkg_total - pay_amt_2425
        if bal_2425_after == expected_bal_2425_after:
            report["passed"].append(f"3. LKG balance updated correctly after payment (Rs. {expected_bal_2425_after}).")
        else:
            report["failed"].append(f"3. LKG balance wrong after payment. Expected {expected_bal_2425_after}, got {bal_2425_after}")
            
        # 7. Promote Student to UKG (Academic Year 2025-2026)
        print(" [+] Promoting student to UKG for 2025-2026...")
        admin_service.promote_student(
            db, created_student_id, years["2025-2026"].year_id, "UKG", "A"
        )
        
        # Verify enrollment statuses
        old_enrollment = db.query(StudentEnrollment).filter_by(
            student_id=created_student_id,
            academic_year_id=years["2024-2025"].year_id
        ).first()
        new_enrollment = db.query(StudentEnrollment).filter_by(
            student_id=created_student_id,
            academic_year_id=years["2025-2026"].year_id
        ).first()
        
        if old_enrollment.status == "Promoted" and new_enrollment.status == "Active":
            report["passed"].append("4. Promotion correctly closes old enrollment and opens new active enrollment.")
        else:
            report["failed"].append(f"4. Enrollment status wrong. Old: {old_enrollment.status}, New: {new_enrollment.status}")
            
        # Verify legacy Student table columns are updated
        student = db.query(Student).filter_by(student_id=created_student_id).first()
        if student.class_ == "UKG" and student.section == "A":
            report["passed"].append("5. Legacy Student master class and section updated correctly.")
        else:
            report["failed"].append(f"5. Master student class mismatch. Expected UKG, got {student.class_}")
            
        # Verify LKG balance remains unchanged
        summary_2425_post_promo = fees_service.get_student_fee_summary_data(
            db, created_student_id, years["2024-2025"].year_id, term1.term_id
        )
        bal_2425_post = Decimal(str(summary_2425_post_promo["aggregates"]["total_balance"]))
        if bal_2425_post == expected_bal_2425_after:
            report["passed"].append("6. Previous academic year's fee balance is preserved post-promotion.")
        else:
            report["failed"].append(f"6. Previous year balance polluted post-promotion. Expected {expected_bal_2425_after}, got {bal_2425_post}")
            
        # Verify UKG balance is correct
        summary_2526 = fees_service.get_student_fee_summary_data(
            db, created_student_id, years["2025-2026"].year_id, term1.term_id
        )
        bal_2526 = Decimal(str(summary_2526["aggregates"]["total_balance"]))
        if bal_2526 == ukg_total:
            report["passed"].append(f"7. Promoted year (UKG) fee structure assigned correctly (Rs. {ukg_total}).")
        else:
            report["failed"].append(f"7. UKG fee structure wrong. Expected {ukg_total}, got {bal_2526}")
            
        # Make UKG payment in full
        pay_res_2526 = fees_service.process_payment(
            db, created_student_id, term1.term_id, years["2025-2026"].year_id, float(ukg_total), 0.0, 0.0
        )
        print(f" [+] Made UKG payment of Rs. {ukg_total}. Receipt: {pay_res_2526['receipt_no']}")
        
        summary_2526_after = fees_service.get_student_fee_summary_data(
            db, created_student_id, years["2025-2026"].year_id, term1.term_id
        )
        bal_2526_after = Decimal(str(summary_2526_after["aggregates"]["total_balance"]))
        if bal_2526_after == Decimal("0.0"):
            report["passed"].append("8. UKG balance is 0 after full payment.")
        else:
            report["failed"].append(f"8. UKG balance not zero. Got {bal_2526_after}")
            
        # 8. Promote student to Class I (2026-2027)
        print(" [+] Promoting student to Class 1 for 2026-2027...")
        admin_service.promote_student(
            db, created_student_id, years["2026-2027"].year_id, "1", "A"
        )
        
        # Verify Class 1 balance
        summary_2627 = fees_service.get_student_fee_summary_data(
            db, created_student_id, years["2026-2027"].year_id, term1.term_id
        )
        bal_2627 = Decimal(str(summary_2627["aggregates"]["total_balance"]))
        if bal_2627 == class1_total:
            report["passed"].append(f"9. Class 1 fee structure assigned correctly (Rs. {class1_total}).")
        else:
            report["failed"].append(f"9. Class 1 fee structure wrong. Expected {class1_total}, got {bal_2627}")
            
        # 9. Verify Reports Filtered by Academic Year & Enrollment
        # A. Pending fees report for 2024-2025 should show LKG pending
        pending_2425_rep = fee_reports.get_pending_fees_report(
            academic_year_id=years["2024-2025"].year_id,
            school_class="LKG",
            term_id=term1.term_id,
            db=db,
            admin=None
        )
        found_2425 = [r for r in pending_2425_rep.rows if r.pending == float(expected_bal_2425_after) and r.school_class == "LKG"]
        if found_2425:
            report["passed"].append(f"10. Pending fees report for 2024-2025 correctly lists student in LKG with Rs. {expected_bal_2425_after} pending.")
        else:
            report["failed"].append("10. Pending fees report for 2024-2025 did not find LKG student with expected pending balance.")
            
        # B. Pending fees report for 2025-2026 should NOT show student (as UKG is fully paid)
        pending_2526_rep = fee_reports.get_pending_fees_report(
            academic_year_id=years["2025-2026"].year_id,
            school_class="UKG",
            term_id=term1.term_id,
            db=db,
            admin=None
        )
        found_2526 = [r for r in pending_2526_rep.rows if "History" in r.student_name]
        if not found_2526:
            report["passed"].append("11. Pending fees report for 2025-2026 correctly omits fully paid UKG student.")
        else:
            report["failed"].append("11. Pending fees report for 2025-2026 included fully paid UKG student.")
            
        # C. Payment report for 2024-2025 should show LKG payment
        payment_2425_rep = fee_reports.get_payment_report(
            academic_year_id=years["2024-2025"].year_id,
            school_class="LKG",
            term_id=term1.term_id,
            db=db,
            admin=None
        )
        found_pay_2425 = [r for r in payment_2425_rep.rows if r.amount_paid == float(pay_amt_2425) and r.school_class == "LKG"]
        if found_pay_2425:
            report["passed"].append(f"12. Payment report for 2024-2025 correctly lists {pay_amt_2425} paid as school_class='LKG'.")
        else:
            report["failed"].append("12. Payment report for 2024-2025 did not show LKG payment.")
            
        # D. Payment report for 2025-2026 should show UKG payment
        payment_2526_rep = fee_reports.get_payment_report(
            academic_year_id=years["2025-2026"].year_id,
            school_class="UKG",
            term_id=term1.term_id,
            db=db,
            admin=None
        )
        found_pay_2526_sum = sum(r.amount_paid for r in payment_2526_rep.rows if r.school_class == "UKG")
        if found_pay_2526_sum == float(ukg_total):
            report["passed"].append(f"13. Payment report for 2025-2026 correctly lists total {ukg_total} paid as school_class='UKG'.")
        else:
            report["failed"].append(f"13. Payment report for 2025-2026 did not show UKG payment. Expected sum {ukg_total}, got {found_pay_2526_sum}")
            
    except Exception as e:
        report["failed"].append(f"QA Execution Error: {str(e)}")
        traceback.print_exc()
        
    finally:
        # Cleanup test records
        print(" [+] Cleaning up test records...")
        db.query(FeePayment).filter_by(student_id=created_student_id).delete()
        db.query(StudentEnrollment).filter_by(student_id=created_student_id).delete()
        db.query(Student).filter_by(student_id=created_student_id).delete()
        db.commit()
        
        # Restore original active academic year
        db.query(AcademicYear).update({AcademicYear.status: "INACTIVE"})
        if original_active_ay_id:
            db.query(AcademicYear).filter(AcademicYear.year_id == original_active_ay_id).update({AcademicYear.status: "ACTIVE"})
            db.commit()
            print(f" [+] Restored original active academic year ID: {original_active_ay_id}")
            
        db.close()
        
    # Print summary
    print("\n" + "="*70)
    print("INTEGRATION QA RESULTS FOR STUDENT ENROLLMENT HISTORY & PROMOTION")
    print("="*70)
    print("PASSED:")
    for p in report["passed"]:
        print(f" [PASS] {p}")
    print("\nFAILED:")
    for f in report["failed"]:
        print(f" [FAIL] {f}")
    print("="*70)
    
    if len(report["failed"]) > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    run_qa_enrollment_history()
