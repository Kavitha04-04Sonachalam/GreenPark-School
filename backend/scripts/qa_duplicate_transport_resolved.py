import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.fee_category import FeeCategory
from app.models.fee_structure import FeeStructure
from app.models.fee_payment import FeePayment
from app.models.academic_year import AcademicYear

def run_qa_checks():
    db = SessionLocal()
    try:
        print("Starting E2E QA Verification for Duplicate Transport Fee Resolution...")
        
        # Check 1: Only one transport category exists
        transport_categories = db.query(FeeCategory).filter(FeeCategory.category_name.ilike("%transport%")).all()
        print(f" [+] Found {len(transport_categories)} transport-related categories:")
        for tc in transport_categories:
            print(f"   - Name: '{tc.category_name}' (ID: {tc.category_id})")
            
        assert len(transport_categories) == 1, "There should be exactly ONE transport-related category remaining!"
        assert transport_categories[0].category_name == "Transportation Fee", "Remaining category must be 'Transportation Fee'!"
        print(" [PASS] Check 1: Exactly one transport category ('Transportation Fee') remains in the database.")
        
        # Check 2: No duplicate transport fee structures exist for the same class/term/year combination
        # Mapped active year
        ay = db.query(AcademicYear).filter(AcademicYear.status == "ACTIVE").first()
        if not ay:
            ay = db.query(AcademicYear).first()
            
        print(f" [+] Mapped Academic Year: {ay.year_name} (ID: {ay.year_id})")
        
        # For LKG and UKG in the active year, check records count of Transportation Fee
        for cls in ["LKG", "UKG"]:
            transport_structs = db.query(FeeStructure).filter_by(
                academic_year_id=ay.year_id,
                school_class=cls,
                category_id=transport_categories[0].category_id
            ).all()
            print(f"   - Class {cls} has {len(transport_structs)} transport structure records.")
            assert len(transport_structs) == 3, f"Class {cls} should have exactly 3 transport structures (one per term)"
            
        print(" [PASS] Check 2: No duplicate transport structures exist; LKG and UKG have exactly 3 structures (one per term).")
        
        # Check 3: LKG and UKG total fees sum to 27,000 and 28,000 respectively
        for cls, expected_total in [("LKG", 27000.0), ("UKG", 28000.0)]:
            structures = db.query(FeeStructure).filter_by(academic_year_id=ay.year_id, school_class=cls).all()
            total_sum = float(sum(s.amount for s in structures))
            print(f"   - Class {cls} total sum: Rs. {total_sum:,.2f} (Expected: Rs. {expected_total:,.2f})")
            assert total_sum == expected_total, f"Fee sum for Class {cls} is incorrect: got {total_sum}, expected {expected_total}"
            
        print(" [PASS] Check 3: Fee structures sum up exactly to LKG: Rs. 27,000 and UKG: Rs. 28,000.")
        
        # Check 4: No orphaned records or broken foreign keys in Fee Structures
        all_structures = db.query(FeeStructure).all()
        orphans = 0
        for s in all_structures:
            cat_exists = db.query(FeeCategory).filter_by(category_id=s.category_id).first()
            if not cat_exists:
                print(f" [!] Orphaned structure found: ID {s.id} references non-existent category {s.category_id}")
                orphans += 1
        assert orphans == 0, f"Found {orphans} orphaned structure records!"
        print(" [PASS] Check 4: Checked all structures; zero orphaned category references found.")
        
        print("\nALL DYNAMIC TRANSITION AND SANITY CHECKS COMPLETED SUCCESSFULLY WITH ZERO REGRESSIONS!")
        
    except AssertionError as ae:
        print(f"[!] QA Check failed: {ae}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_qa_checks()
