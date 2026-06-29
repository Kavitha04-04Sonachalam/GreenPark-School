import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.fee_category import FeeCategory
from app.models.fee_structure import FeeStructure
from app.models.fee_payment import FeePayment

db = SessionLocal()
try:
    print("FEE CATEGORIES:")
    cats = db.query(FeeCategory).all()
    for c in cats:
        structs_count = db.query(FeeStructure).filter_by(category_id=c.category_id).count()
        payments_count = db.query(FeePayment).filter_by(fee_structure_id=FeeStructure.id).filter(FeeStructure.category_id == c.category_id).count()
        print(f" - ID {c.category_id}: '{c.category_name}' ({structs_count} structures, {payments_count} payments)")
        
    print("\nLKG Fee Structures:")
    lkg_structs = db.query(FeeStructure).filter_by(school_class="LKG").all()
    for s in lkg_structs:
        cat = db.query(FeeCategory).filter_by(category_id=s.category_id).first()
        print(f" - Year ID {s.academic_year_id}, Term ID {s.term_id}, Cat: '{cat.category_name}' (ID {s.category_id}), Amount: {s.amount}")
        
    print("\nUKG Fee Structures:")
    ukg_structs = db.query(FeeStructure).filter_by(school_class="UKG").all()
    for s in ukg_structs:
        cat = db.query(FeeCategory).filter_by(category_id=s.category_id).first()
        print(f" - Year ID {s.academic_year_id}, Term ID {s.term_id}, Cat: '{cat.category_name}' (ID {s.category_id}), Amount: {s.amount}")
finally:
    db.close()
