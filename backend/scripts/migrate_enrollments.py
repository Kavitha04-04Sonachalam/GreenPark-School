import os
import sys

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal, engine
from app.models.base import Base
from app.models.student import Student
from app.models.academic_year import AcademicYear
from app.models.student_enrollment import StudentEnrollment

def run_migration():
    print("Starting database migration for student_enrollments...")
    
    # 1. Create table if not exists
    Base.metadata.create_all(bind=engine)
    print(" [+] StudentEnrollment table created/verified in DB.")
    
    db = SessionLocal()
    try:
        # Resolve active Academic Year as default fallback
        active_ay = db.query(AcademicYear).filter(AcademicYear.status == "ACTIVE").first()
        if not active_ay:
            active_ay = db.query(AcademicYear).first()
            
        students = db.query(Student).all()
        print(f" [+] Found {len(students)} students to migrate.")
        
        migrated_count = 0
        skipped_count = 0
        
        for student in students:
            # Resolve appropriate academic year for this student
            ay_id = None
            if student.academic_year:
                # Try finding matching academic year (e.g. '2024-25' vs '2025-2026')
                year_name = student.academic_year.strip()
                # Normalize string mapping if needed
                if year_name == "2024-25":
                    year_name = "2024-2025"
                elif year_name == "2025-26":
                    year_name = "2025-2026"
                elif year_name == "2029-30":
                    year_name = "2029-2030"
                    
                match_ay = db.query(AcademicYear).filter(AcademicYear.year_name == year_name).first()
                if match_ay:
                    ay_id = match_ay.year_id
                    
            if not ay_id:
                ay_id = active_ay.year_id if active_ay else 1
                
            # Verify if enrollment already exists
            existing = db.query(StudentEnrollment).filter_by(
                student_id=student.student_id,
                academic_year_id=ay_id
            ).first()
            
            if existing:
                skipped_count += 1
                continue
                
            # Create active enrollment
            enrollment = StudentEnrollment(
                student_id=student.student_id,
                academic_year_id=ay_id,
                school_class=student.class_ or "LKG",
                section=student.section or "A",
                roll_number=student.roll_number,
                status="Active"
            )
            db.add(enrollment)
            migrated_count += 1
            
        db.commit()
        print(f"Migration completed. Created {migrated_count} enrollment records. Skipped {skipped_count} existing records.")
        
    except Exception as e:
        db.rollback()
        print(f"[!] Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
