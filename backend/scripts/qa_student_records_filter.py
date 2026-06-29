import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import date
from app.core.database import SessionLocal
from app.models.student import Student
from app.models.student_enrollment import StudentEnrollment
from app.models.academic_year import AcademicYear
from app.services import admin_service

def run_tests():
    db = SessionLocal()
    try:
        print("Running Student Records Academic Year & Filter QA Integration Tests...")
        
        # 1. Resolve Academic Years
        ay_2526 = db.query(AcademicYear).filter(AcademicYear.year_name == "2025-2026").first()
        ay_2627 = db.query(AcademicYear).filter(AcademicYear.year_name == "2026-2027").first()
        
        if not (ay_2526 and ay_2627):
            print("[!] Mapped academic years (2025-2026 / 2026-2027) not found in database.")
            return
            
        print(f" [+] 2025-2026 ID: {ay_2526.year_id}, 2026-2027 ID: {ay_2627.year_id}")
        
        # 2. Setup Test Student
        # Clean existing test records if any
        db.query(StudentEnrollment).filter(StudentEnrollment.student_id == "QA-REC-01").delete()
        db.query(Student).filter(Student.student_id == "QA-REC-01").delete()
        db.commit()
        
        student = Student(
            student_id="QA-REC-01",
            first_name="Zachary",
            last_name="Filtertest",
            gender="Male",
            date_of_birth=date(2010, 5, 5),
            class_="LKG",
            section="A",
            roll_number="99",
            academic_year="2025-2026",
            admission_number="ADM-99",
            parent_id="P-ZACH"
        )
        db.add(student)
        db.commit()
        
        # Create enrollment in 2025-2026 LKG
        enroll_2526 = StudentEnrollment(
            student_id="QA-REC-01",
            academic_year_id=ay_2526.year_id,
            school_class="LKG",
            section="A",
            roll_number="99",
            status="Active"
        )
        db.add(enroll_2526)
        db.commit()
        print(" [+] Initialized Test Student Zachary Filtertest in LKG (2025-2026).")
        
        # 3. Test 1: Retrieve Zachary by filtering LKG + A + 2025-2026
        students_2526 = admin_service.get_students(
            db=db,
            class_name="LKG",
            section="A",
            academic_year_id=ay_2526.year_id
        )
        assert len(students_2526) > 0, "Should return students in 2025-2026 LKG"
        zach = next((s for s in students_2526 if s.student_id == "QA-REC-01"), None)
        assert zach is not None, "Zachary should be in the returned list"
        assert zach.class_ == "LKG", f"Class should be LKG, got {zach.class_}"
        assert zach.roll_number == "99", f"Roll number should be 99, got {zach.roll_number}"
        print(" [PASS] Test 1: Retrieved Zachary correctly with Year + Class + Section filters.")
        
        # 4. Test 2: Retrieve Zachary for LKG + A + 2026-2027 (should not return Zachary)
        students_2627 = admin_service.get_students(
            db=db,
            class_name="LKG",
            section="A",
            academic_year_id=ay_2627.year_id
        )
        zach_2627 = next((s for s in students_2627 if s.student_id == "QA-REC-01"), None)
        assert zach_2627 is None, "Zachary should NOT be enrolled in LKG for 2026-2027"
        print(" [PASS] Test 2: Querying different academic year correctly excludes non-enrolled students.")
        
        # 5. Test 3: Search filters
        # Search by first name
        res_search_first = admin_service.get_students(
            db=db,
            class_name="LKG",
            section="A",
            academic_year_id=ay_2526.year_id,
            search="Zacha"
        )
        assert len(res_search_first) == 1 and res_search_first[0].student_id == "QA-REC-01", "Should find Zachary by first name"
        
        # Search by last name
        res_search_last = admin_service.get_students(
            db=db,
            class_name="LKG",
            section="A",
            academic_year_id=ay_2526.year_id,
            search="filterte"
        )
        assert len(res_search_last) == 1 and res_search_last[0].student_id == "QA-REC-01", "Should find Zachary by last name"
        
        # Search by parent ID
        res_search_parent = admin_service.get_students(
            db=db,
            class_name="LKG",
            section="A",
            academic_year_id=ay_2526.year_id,
            search="P-ZACH"
        )
        assert len(res_search_parent) == 1 and res_search_parent[0].student_id == "QA-REC-01", "Should find Zachary by parent ID"
        print(" [PASS] Test 3: Search filter correctly matches by first name, last name, and parent ID.")
        
        # 6. Clean up
        db.query(StudentEnrollment).filter(StudentEnrollment.student_id == "QA-REC-01").delete()
        db.query(Student).filter(Student.student_id == "QA-REC-01").delete()
        db.commit()
        print(" [+] Cleaned up integration test records.")
        print("\nALL STUDENT RECORDS FILTERING INTEGRATION TESTS PASSED SUCCESSFULLY!")
        
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
