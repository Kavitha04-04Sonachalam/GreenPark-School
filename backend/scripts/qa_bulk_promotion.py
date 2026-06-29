import os
import sys
from decimal import Decimal
import traceback
from datetime import date

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.student import Student
from app.models.academic_year import AcademicYear
from app.models.term import Term
from app.models.fee_category import FeeCategory
from app.models.fee_structure import FeeStructure
from app.models.fee_payment import FeePayment
from app.models.student_enrollment import StudentEnrollment
from app.models.promotion_audit_log import PromotionAuditLog
from app.services import admin_service, fees_service

def run_qa_bulk_promotion():
    db = SessionLocal()
    report = {"passed": [], "failed": []}
    
    # Track original state to restore
    original_active_ay_id = None
    created_student_ids = ["BULK-QA-01", "BULK-QA-02", "BULK-QA-03", "BULK-QA-04"]
    
    try:
        print("Starting QA Bulk Promotion & Transaction Safety Integration Test...")
        
        # 1. Setup Academic Years: 2024-2025 (current), 2025-2026 (target)
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
            
        # Record original active year
        active_ay = db.query(AcademicYear).filter(AcademicYear.status == "ACTIVE").first()
        if active_ay:
            original_active_ay_id = active_ay.year_id
            
        # 2. Setup Term and Category
        term1 = db.query(Term).filter(Term.term_name == "Term 1").first()
        if not term1:
            term1 = Term(term_name="Term 1")
            db.add(term1)
            db.commit()
            db.refresh(term1)
            
        cat_course = db.query(FeeCategory).filter(FeeCategory.category_name == "Course Fee").first()
        if not cat_course:
            cat_course = FeeCategory(category_name="Course Fee")
            db.add(cat_course)
            db.commit()
            db.refresh(cat_course)

        # 3. Setup Fee Structures
        # Target UKG Fee Structure exists
        ukg_struct = db.query(FeeStructure).filter_by(
            academic_year_id=years["2025-2026"].year_id,
            school_class="UKG",
            term_id=term1.term_id,
            category_id=cat_course.category_id
        ).first()
        if not ukg_struct:
            ukg_struct = FeeStructure(
                academic_year_id=years["2025-2026"].year_id,
                school_class="UKG",
                term_id=term1.term_id,
                category_id=cat_course.category_id,
                amount=28000.0
            )
            db.add(ukg_struct)
            db.commit()
            print(" [+] Verified Target UKG Fee Structure exists.")
            
        # Target Class 1 Fee Structure is deliberately deleted/missing to test fee validation!
        db.query(FeeStructure).filter_by(
            academic_year_id=years["2025-2026"].year_id,
            school_class="1"
        ).delete()
        db.commit()
        print(" [+] Cleared Target Class 1 Fee Structure to verify structure checks.")

        # 4. Clean up any existing test records
        for sid in created_student_ids:
            db.query(FeePayment).filter_by(student_id=sid).delete()
            db.query(StudentEnrollment).filter_by(student_id=sid).delete()
            db.query(PromotionAuditLog).filter_by(student_id=sid).delete()
            db.query(Student).filter_by(student_id=sid).delete()
        db.commit()
        
        # 5. Set 2024-2025 as Active and create test students in LKG and XII
        db.query(AcademicYear).update({AcademicYear.status: "INACTIVE"})
        years["2024-2025"].status = "ACTIVE"
        db.commit()
        
        # Student 1 in LKG
        admin_service.create_student(db, {
            "student_id": "BULK-QA-01",
            "admission_number": "ADM-BQA-01",
            "first_name": "Alice",
            "last_name": "LKG",
            "roll_number": "LKG01",
            "class_": "LKG",
            "section": "A",
            "gender": "Female",
            "parent_id": "P-TEST"
        })
        
        # Student 2 in LKG
        admin_service.create_student(db, {
            "student_id": "BULK-QA-02",
            "admission_number": "ADM-BQA-02",
            "first_name": "Bob",
            "last_name": "LKG",
            "roll_number": "LKG02",
            "class_": "LKG",
            "section": "A",
            "gender": "Male",
            "parent_id": "P-TEST"
        })
        
        # Student 3 in Class XII
        admin_service.create_student(db, {
            "student_id": "BULK-QA-03",
            "admission_number": "ADM-BQA-03",
            "first_name": "Charlie",
            "last_name": "XII",
            "roll_number": "XII01",
            "class_": "12",
            "section": "A",
            "gender": "Male",
            "parent_id": "P-TEST"
        })
        
        # Student 4 in LKG
        admin_service.create_student(db, {
            "student_id": "BULK-QA-04",
            "admission_number": "ADM-BQA-04",
            "first_name": "Diana",
            "last_name": "LKG",
            "roll_number": "LKG04",
            "class_": "LKG",
            "section": "A",
            "gender": "Female",
            "parent_id": "P-TEST"
        })
        
        db.commit()
        print(" [+] Initialized test students.")

        # 6. Test Fee Structure Validation Check
        # Try promoting LKG students to Class 1 (whose fee structure is missing).
        # It should raise a 400 HTTPException from the service layer directly.
        try:
            admin_service.promote_students_bulk(
                db=db,
                student_ids=["BULK-QA-01", "BULK-QA-02"],
                target_academic_year_id=years["2025-2026"].year_id,
                target_class="1",
                target_section="A",
                promoted_by="Admin-QA"
            )
            report["failed"].append("1. Fee Structure Validation failed: Promotion succeeded even with missing target structures.")
        except Exception as e:
            if "are not configured" in str(e):
                report["passed"].append("1. Fee Structure Validation correctly blocks promotion when structures are missing.")
            else:
                report["failed"].append(f"1. Fee Structure Validation raised unexpected exception: {e}")

        # 7. Test Successful Bulk Promotion to UKG
        # Promoting BULK-QA-01 and BULK-QA-02 to UKG (fee structures configured).
        res_promo = admin_service.promote_students_bulk(
            db=db,
            student_ids=["BULK-QA-01", "BULK-QA-02"],
            target_academic_year_id=years["2025-2026"].year_id,
            target_class="UKG",
            target_section="A",
            promoted_by="Admin-QA"
        )
        
        if res_promo["total_success"] == 2 and res_promo["total_failed"] == 0:
            report["passed"].append("2. Bulk promotion executes successfully for valid students.")
        else:
            report["failed"].append(f"2. Bulk promotion failed. Details: {res_promo}")

        # Verify StudentEnrollment and Student model updates for Alice
        stu_alice = db.query(Student).filter_by(student_id="BULK-QA-01").first()
        enr_alice_2425 = db.query(StudentEnrollment).filter_by(student_id="BULK-QA-01", academic_year_id=years["2024-2025"].year_id).first()
        enr_alice_2526 = db.query(StudentEnrollment).filter_by(student_id="BULK-QA-01", academic_year_id=years["2025-2026"].year_id).first()
        
        if (
            stu_alice.class_ == "UKG" and 
            enr_alice_2425.status == "Promoted" and 
            enr_alice_2526.status == "Active" and 
            enr_alice_2526.school_class == "UKG"
        ):
            report["passed"].append("3. Alice enrollment closed, target active enrollment opened, and master student class updated.")
        else:
            report["failed"].append("3. Alice promotion enrollment state mismatch.")

        # Check Promotion Audit Logs for Alice
        log_alice = db.query(PromotionAuditLog).filter_by(student_id="BULK-QA-01", status="Success").first()
        if log_alice and log_alice.new_class == "UKG" and log_alice.promoted_by == "Admin-QA":
            report["passed"].append("4. Promotion Audit Log correctly captures Alice's success.")
        else:
            report["failed"].append("4. Promotion Audit Log entry missing or wrong for Alice.")

        # 8. Test Partial Promotion Failure (Transaction Savepoint Rollback)
        # We promote BULK-QA-01 (already promoted to UKG) and BULK-QA-04 (not yet promoted).
        # Student 1 should FAIL (already enrolled). Student 4 should SUCCEED.
        res_partial = admin_service.promote_students_bulk(
            db=db,
            student_ids=["BULK-QA-01", "BULK-QA-04"],
            target_academic_year_id=years["2025-2026"].year_id,
            target_class="UKG",
            target_section="A",
            promoted_by="Admin-QA"
        )
        
        # Verify that BULK-QA-04 was successfully promoted
        stu_diana = db.query(Student).filter_by(student_id="BULK-QA-04").first()
        enr_diana_2526 = db.query(StudentEnrollment).filter_by(student_id="BULK-QA-04", academic_year_id=years["2025-2026"].year_id).first()
        
        # Verify that BULK-QA-01 failed and did not duplicate/pollute target enrollment
        enr_alice_2526_count = db.query(StudentEnrollment).filter_by(student_id="BULK-QA-01", academic_year_id=years["2025-2026"].year_id).count()
        
        # Check logs for failures
        log_fail = db.query(PromotionAuditLog).filter_by(student_id="BULK-QA-01", status="Failed").first()
        
        if (
            res_partial["total_success"] == 1 and 
            res_partial["total_failed"] == 1 and
            stu_diana.class_ == "UKG" and 
            enr_diana_2526.status == "Active" and
            enr_alice_2526_count == 1 and
            log_fail is not None
        ):
            report["passed"].append("5. Transaction savepoint successfully rolls back failed student while committing successful student.")
        else:
            report["failed"].append(f"5. Partial promotion transaction rollback logic failed. Details: {res_partial}")

        # 9. Test Class XII Graduation Flow
        # Charlie is in Class 12. We graduate him.
        res_grad = admin_service.promote_students_bulk(
            db=db,
            student_ids=["BULK-QA-03"],
            target_academic_year_id=years["2025-2026"].year_id,
            target_class="Completed",
            target_section="Alumni",
            promoted_by="Admin-QA"
        )
        
        stu_charlie = db.query(Student).filter_by(student_id="BULK-QA-03").first()
        enr_charlie_2425 = db.query(StudentEnrollment).filter_by(student_id="BULK-QA-03", academic_year_id=years["2024-2025"].year_id).first()
        enr_charlie_2526 = db.query(StudentEnrollment).filter_by(student_id="BULK-QA-03", academic_year_id=years["2025-2026"].year_id).first()
        log_charlie = db.query(PromotionAuditLog).filter_by(student_id="BULK-QA-03", new_class="Completed").first()
        
        print(f"Charlie Graduation debug info:")
        print(f" - res_grad: {res_grad}")
        print(f" - stu_charlie.class_: {stu_charlie.class_ if stu_charlie else 'None'}")
        print(f" - stu_charlie.section: {stu_charlie.section if stu_charlie else 'None'}")
        print(f" - enr_charlie_2425 status: {enr_charlie_2425.status if enr_charlie_2425 else 'None'}")
        print(f" - enr_charlie_2526 is None: {enr_charlie_2526 is None}")
        print(f" - log_charlie is not None: {log_charlie is not None}")

        if (
            res_grad["total_success"] == 1 and
            stu_charlie.class_ == "Completed" and
            stu_charlie.section == "-" and
            enr_charlie_2425.status == "Completed" and
            enr_charlie_2526 is None and # No target enrollment created
            log_charlie is not None
        ):
            report["passed"].append("6. Class XII candidates graduate correctly to Completed/Alumni without creating target enrollments.")
        else:
            report["failed"].append("6. Class XII graduation flow failed.")

    except Exception as e:
        report["failed"].append(f"QA Bulk Promotion Execution Error: {str(e)}")
        traceback.print_exc()
        
    finally:
        # Cleanup test records
        print(" [+] Cleaning up test records...")
        for sid in created_student_ids:
            db.query(FeePayment).filter_by(student_id=sid).delete()
            db.query(StudentEnrollment).filter_by(student_id=sid).delete()
            db.query(PromotionAuditLog).filter_by(student_id=sid).delete()
            db.query(Student).filter_by(student_id=sid).delete()
        db.commit()
        
        # Restore active year
        db.query(AcademicYear).update({AcademicYear.status: "INACTIVE"})
        if original_active_ay_id:
            db.query(AcademicYear).filter(AcademicYear.year_id == original_active_ay_id).update({AcademicYear.status: "ACTIVE"})
            db.commit()
            print(f" [+] Restored original active academic year ID: {original_active_ay_id}")
            
        db.close()
        
    # Print summary
    print("\n" + "="*70)
    print("INTEGRATION QA RESULTS FOR SAFE BULK PROMOTIONS & GRADUATIONS")
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
    run_qa_bulk_promotion()
