import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.fee_category import FeeCategory
from app.models.fee_structure import FeeStructure
from app.models.fee_payment import FeePayment
from app.models.academic_year import AcademicYear

def run_migration():
    db = SessionLocal()
    try:
        print("Starting Database Migration for Duplicate Transport Fee Categories...")
        
        # 1. Resolve or create canonical "Transportation Fee" category
        canonical_name = "Transportation Fee"
        canonical_cat = db.query(FeeCategory).filter(FeeCategory.category_name == canonical_name).first()
        if not canonical_cat:
            canonical_cat = FeeCategory(category_name=canonical_name)
            db.add(canonical_cat)
            db.commit()
            db.refresh(canonical_cat)
            print(f" [+] Created canonical Category: '{canonical_name}' (ID: {canonical_cat.category_id})")
        else:
            print(f" [+] Found canonical Category: '{canonical_name}' (ID: {canonical_cat.category_id})")
            
        # 2. Find all duplicate transport-related categories dynamically (excluding the canonical one)
        # Search case-insensitively for names matching '%transport%'
        duplicate_cats = db.query(FeeCategory).filter(
            FeeCategory.category_name.ilike("%transport%"),
            FeeCategory.category_name != canonical_name
        ).all()
        
        if not duplicate_cats:
            print(" [+] No duplicate transport-related categories found in the database. System is already clean.")
            # Verify totals anyway
            verify_totals(db)
            return
            
        print(f" [+] Found {len(duplicate_cats)} duplicate categories:")
        for dc in duplicate_cats:
            print(f"   - ID {dc.category_id}: '{dc.category_name}'")
            
        # Begin transaction
        # Loop through duplicate categories
        total_structures_deleted = 0
        total_structures_updated = 0
        total_payments_relinked = 0
        
        for dc in duplicate_cats:
            print(f"\nProcessing duplicate Category '{dc.category_name}' (ID {dc.category_id})...")
            
            # Fetch all fee structures referencing this duplicate category
            dup_structures = db.query(FeeStructure).filter(FeeStructure.category_id == dc.category_id).all()
            print(f" - Found {len(dup_structures)} fee structures linked to this category.")
            
            for ds in dup_structures:
                # Check if an equivalent structure with canonical category already exists
                canonical_struct = db.query(FeeStructure).filter_by(
                    academic_year_id=ds.academic_year_id,
                    school_class=ds.school_class,
                    term_id=ds.term_id,
                    category_id=canonical_cat.category_id
                ).first()
                
                if canonical_struct:
                    # Canonical structure exists. Re-link payments of duplicate structure to canonical structure.
                    payments = db.query(FeePayment).filter(FeePayment.fee_structure_id == ds.id).all()
                    if payments:
                        print(f"   * Re-linking {len(payments)} payments from duplicate structure ID {ds.id} to canonical structure ID {canonical_struct.id}")
                        for p in payments:
                            p.fee_structure_id = canonical_struct.id
                            total_payments_relinked += 1
                            
                    # Delete the duplicate structure
                    db.delete(ds)
                    total_structures_deleted += 1
                else:
                    # Canonical structure does not exist. Simply convert the duplicate structure to canonical category.
                    print(f"   * Converting structure ID {ds.id} (Class: {ds.school_class}, Term: {ds.term_id}, Year ID: {ds.academic_year_id}) to canonical category ID {canonical_cat.category_id}")
                    ds.category_id = canonical_cat.category_id
                    total_structures_updated += 1
                    
            db.commit()
            
            # Deactivate/delete duplicate Category if no structures remain referencing it
            remaining_refs = db.query(FeeStructure).filter(FeeStructure.category_id == dc.category_id).count()
            remaining_payments = db.query(FeePayment).join(
                FeeStructure, FeePayment.fee_structure_id == FeeStructure.id
            ).filter(FeeStructure.category_id == dc.category_id).count()
            
            if remaining_refs == 0 and remaining_payments == 0:
                print(f" - Deleting duplicate category ID {dc.category_id} ('{dc.category_name}')...")
                db.delete(dc)
                db.commit()
                print(f" - Deleted duplicate category ID {dc.category_id} successfully.")
            else:
                print(f" [!] Warning: Duplicate category ID {dc.category_id} still has references. Cannot delete.")
                
        print("\n=======================================================")
        print("MIGRATION SUMMARY:")
        print(f" - Total duplicate categories processed/deleted: {len(duplicate_cats)}")
        print(f" - Fee structures deleted/merged: {total_structures_deleted}")
        print(f" - Fee structures updated to canonical: {total_structures_updated}")
        print(f" - Payments re-linked: {total_payments_relinked}")
        print("=======================================================\n")
        
        # Verify LKG and UKG totals
        verify_totals(db)
        
    except Exception as e:
        db.rollback()
        print(f"[!] Migration failed: {e}")
        sys.exit(1)
    finally:
        db.close()

def verify_totals(db):
    print("VERIFYING FEE STRUCTURE TOTALS FOR ACTIVE YEAR...")
    # Resolve active academic year
    ay = db.query(AcademicYear).filter(AcademicYear.status == "ACTIVE").first()
    if not ay:
        ay = db.query(AcademicYear).first()
        
    if not ay:
        print("[!] No academic years found to verify.")
        return
        
    print(f" [+] Mapped Academic Year: {ay.year_name} (ID: {ay.year_id})")
    
    for cls in ["LKG", "UKG"]:
        structures = db.query(FeeStructure).filter_by(academic_year_id=ay.year_id, school_class=cls).all()
        total_sum = sum(s.amount for s in structures)
        print(f" - Class {cls}: Total sum of {len(structures)} structures is Rs. {total_sum:,.2f}")
        
        # Output detailed splits for checking
        for s in structures:
            cat = db.query(FeeCategory).filter_by(category_id=s.category_id).first()
            print(f"   * Term {s.term_id}: '{cat.category_name}' = Rs. {s.amount:,.2f}")

if __name__ == "__main__":
    run_migration()
