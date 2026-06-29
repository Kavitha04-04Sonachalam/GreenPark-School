import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.fee_structure import FeeStructure
from app.models.academic_year import AcademicYear
from app.models.term import Term
from app.models.fee_category import FeeCategory

db = SessionLocal()
try:
    ay_2526 = db.query(AcademicYear).filter(AcademicYear.year_name == "2025-2026").first()
    ay_2627 = db.query(AcademicYear).filter(AcademicYear.year_name == "2026-2027").first()
    
    print("Academic Year 2025-2026 count:", db.query(FeeStructure).filter_by(academic_year_id=ay_2526.year_id).count())
    print("Academic Year 2026-2027 count:", db.query(FeeStructure).filter_by(academic_year_id=ay_2627.year_id).count())
    
    # Check completeness: every class (LKG, UKG, 1..12) should have terms 1..3 and Categories course, books, misc, transport split correctly.
    classes = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    
    print("\n--- 2026-2027 Structure Breakdown ---")
    for cls in classes:
        cnt = db.query(FeeStructure).filter_by(academic_year_id=ay_2627.year_id, school_class=cls).count()
        print(f" - Class {cls}: {cnt} structure records")
        
    print("\nChecking exact match between 2025-2026 and 2026-2027 (ignoring Class 1 if amount differs)...")
    mismatches = 0
    s_2526 = db.query(FeeStructure).filter_by(academic_year_id=ay_2526.year_id).all()
    for s1 in s_2526:
        # Check if identical structure exists in 2026-2027
        s2 = db.query(FeeStructure).filter_by(
            academic_year_id=ay_2627.year_id,
            school_class=s1.school_class,
            term_id=s1.term_id,
            category_id=s1.category_id
        ).first()
        if not s2:
            print(f" [!] Missing in 2026-2027: Class {s1.school_class}, Term {s1.term_id}, Cat {s1.category_id}")
            mismatches += 1
        elif float(s2.amount) != float(s1.amount):
            # For class 1, the amount was 29000.00 earlier, let's see if that's fine
            print(f" [*] Amount mismatch for Class {s1.school_class}, Term {s1.term_id}, Cat {s1.category_id}: 2526 = {s1.amount}, 2627 = {s2.amount}")
            
    print(f"Mismatches found: {mismatches}")
    
finally:
    db.close()
