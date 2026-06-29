import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.fee_structure import FeeStructure
from app.models.academic_year import AcademicYear

db = SessionLocal()
try:
    print("ACADEMIC YEARS:")
    ays = db.query(AcademicYear).all()
    for ay in ays:
        count = db.query(FeeStructure).filter_by(academic_year_id=ay.year_id).count()
        print(f" - ID {ay.year_id}: {ay.year_name} ({count} structures)")
        
    print("\nFEE STRUCTURES FOR 2025-2026:")
    ay_2526 = db.query(AcademicYear).filter(AcademicYear.year_name == "2025-2026").first()
    if ay_2526:
        structs = db.query(FeeStructure).filter_by(academic_year_id=ay_2526.year_id).all()
        for s in structs:
            print(f" - Class: {s.school_class}, Term: {s.term_id}, Cat: {s.category_id}, Amount: {s.amount}")
            
    print("\nFEE STRUCTURES FOR 2026-2027:")
    ay_2627 = db.query(AcademicYear).filter(AcademicYear.year_name == "2026-2027").first()
    if ay_2627:
        structs = db.query(FeeStructure).filter_by(academic_year_id=ay_2627.year_id).all()
        for s in structs:
            print(f" - Class: {s.school_class}, Term: {s.term_id}, Cat: {s.category_id}, Amount: {s.amount}")
finally:
    db.close()
