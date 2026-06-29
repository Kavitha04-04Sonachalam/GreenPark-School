import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.student import Student
from app.models.student_enrollment import StudentEnrollment
from app.models.academic_year import AcademicYear
from app.services.fees_service import get_legacy_student_fee_summary as get_student_fee_summary

db = SessionLocal()
try:
    students = db.query(Student).all()
    updated_count = 0
    for s in students:
        if not s.academic_year:
            continue
            
        target_ay = db.query(AcademicYear).filter(AcademicYear.year_name == s.academic_year).first()
        if not target_ay:
            continue
            
        # Find active enrollment
        enrollment = db.query(StudentEnrollment).filter_by(
            student_id=s.student_id,
            status="Active"
        ).first()
        
        if enrollment and enrollment.academic_year_id != target_ay.year_id:
            print(f"Syncing student {s.student_id} ({s.first_name} {s.last_name}):")
            print(f" - Moving active enrollment from year ID {enrollment.academic_year_id} to {target_ay.year_id} ({s.academic_year})")
            
            enrollment.academic_year_id = target_ay.year_id
            enrollment.school_class = s.class_ or "LKG"
            enrollment.section = s.section or "A"
            db.commit()
            
            # Re-assign fees for the target year
            try:
                get_student_fee_summary(db, s.student_id, target_ay.year_id)
                print(f" - Assigned fees for year {s.academic_year} successfully.")
            except Exception as e:
                print(f" - Error assigning fees: {e}")
            updated_count += 1
            
    print(f"Enrollments synchronization complete. Updated {updated_count} students.")
finally:
    db.close()
