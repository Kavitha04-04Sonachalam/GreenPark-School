import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.fee_structure import FeeStructure
from app.models.academic_year import AcademicYear

db = SessionLocal()
try:
    source_ay = db.query(AcademicYear).filter(AcademicYear.year_name == "2025-2026").first()
    target_ay = db.query(AcademicYear).filter(AcademicYear.year_name == "2026-2027").first()
    
    if not source_ay or not target_ay:
        print("Academic Years not found.")
        sys.exit(1)
        
    print(f"Duplicating structures from {source_ay.year_name} (ID {source_ay.year_id}) to {target_ay.year_name} (ID {target_ay.year_id})...")
    
    source_structures = db.query(FeeStructure).filter(FeeStructure.academic_year_id == source_ay.year_id).all()
    print(f"Found {len(source_structures)} source structures.")
    
    duplicated_count = 0
    skipped_count = 0
    for src in source_structures:
        # Check target structure existence
        exists = db.query(FeeStructure).filter_by(
            academic_year_id=target_ay.year_id,
            school_class=src.school_class,
            term_id=src.term_id,
            category_id=src.category_id
        ).first()
        if exists:
            skipped_count += 1
            continue
            
        dest_struct = FeeStructure(
            academic_year_id=target_ay.year_id,
            school_class=src.school_class,
            term_id=src.term_id,
            category_id=src.category_id,
            amount=src.amount
        )
        db.add(dest_struct)
        duplicated_count += 1
        
    db.commit()
    print(f"Done. Duplicated: {duplicated_count}, Skipped (existing): {skipped_count}")
    
    # Query final count
    final_count = db.query(FeeStructure).filter_by(academic_year_id=target_ay.year_id).count()
    print(f"Final structures count for {target_ay.year_name}: {final_count}")
    
finally:
    db.close()
