import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.academic_year import AcademicYear
from app.models.term import Term
from app.models.fee_category import FeeCategory
from app.models.fee_structure import FeeStructure

def get_or_create_category(db, name):
    cat = db.query(FeeCategory).filter(FeeCategory.category_name == name).first()
    if not cat:
        cat = FeeCategory(category_name=name)
        db.add(cat)
        db.commit()
        db.refresh(cat)
    return cat

def seed_year_structures(db, ay):
    t1 = db.query(Term).filter(Term.term_name == "Term 1").first()
    t2 = db.query(Term).filter(Term.term_name == "Term 2").first()
    t3 = db.query(Term).filter(Term.term_name == "Term 3").first()
    
    if not (t1 and t2 and t3):
        print(f"[!] Terms not resolved. Skipping year {ay.year_name}")
        return
        
    c_course = get_or_create_category(db, "Course Fee")
    c_books = get_or_create_category(db, "Bag & Book Fee")
    c_misc = get_or_create_category(db, "Miscellaneous Fee")
    c_transport = get_or_create_category(db, "Transportation Fee")
    
    classes = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    fee_totals = {
        "LKG": 27000.0, "UKG": 28000.0, "1": 29000.0, "2": 30000.0,
        "3": 31000.0, "4": 32000.0, "5": 33000.0, "6": 34000.0,
        "7": 35000.0, "8": 36000.0, "9": 37000.0, "10": 38000.0,
        "11": 39000.0, "12": 40000.0
    }
    
    seeded = 0
    for cls in classes:
        total_amount = fee_totals[cls]
        items = []
        
        if cls in ["LKG", "UKG"]:
            course_total = 15000.0 if cls == "LKG" else 16000.0
            books_total = 4000.0
            misc_total = 3000.0
            transport_total = 5000.0
            
            # Check and add for Term 1
            for t, cat, amt in [
                (t1, c_course, course_total * 0.40),
                (t1, c_books, books_total),
                (t1, c_misc, misc_total * 0.40),
                (t1, c_transport, transport_total * 0.40),
                (t2, c_course, course_total * 0.30),
                (t2, c_misc, misc_total * 0.30),
                (t2, c_transport, transport_total * 0.30),
                (t3, c_course, course_total * 0.30),
                (t3, c_misc, misc_total * 0.30),
                (t3, c_transport, transport_total * 0.30)
            ]:
                exists = db.query(FeeStructure).filter_by(
                    academic_year_id=ay.year_id,
                    school_class=cls,
                    term_id=t.term_id,
                    category_id=cat.category_id
                ).first()
                if not exists:
                    items.append(FeeStructure(
                        academic_year_id=ay.year_id,
                        school_class=cls,
                        term_id=t.term_id,
                        category_id=cat.category_id,
                        amount=amt
                    ))
        else:
            is_senior = cls in ["9", "10", "11", "12"]
            books_total = 6000.0 if is_senior else 5000.0
            misc_total = 4000.0
            course_total = total_amount - books_total - misc_total
            
            for t, cat, amt in [
                (t1, c_course, course_total * 0.40),
                (t1, c_books, books_total),
                (t1, c_misc, misc_total * 0.40),
                (t2, c_course, course_total * 0.30),
                (t2, c_misc, misc_total * 0.30),
                (t3, c_course, course_total * 0.30),
                (t3, c_misc, misc_total * 0.30)
            ]:
                exists = db.query(FeeStructure).filter_by(
                    academic_year_id=ay.year_id,
                    school_class=cls,
                    term_id=t.term_id,
                    category_id=cat.category_id
                ).first()
                if not exists:
                    items.append(FeeStructure(
                        academic_year_id=ay.year_id,
                        school_class=cls,
                        term_id=t.term_id,
                        category_id=cat.category_id,
                        amount=amt
                    ))
                    
        if items:
            db.add_all(items)
            db.commit()
            seeded += len(items)
            
    print(f" [+] Year {ay.year_name}: Seeded {seeded} missing fee structures.")

db = SessionLocal()
try:
    # Seed 2025-2026
    ay_2526 = db.query(AcademicYear).filter(AcademicYear.year_name == "2025-2026").first()
    if ay_2526:
        seed_year_structures(db, ay_2526)
        
    # Seed 2026-2027
    ay_2627 = db.query(AcademicYear).filter(AcademicYear.year_name == "2026-2027").first()
    if ay_2627:
        seed_year_structures(db, ay_2627)
        
finally:
    db.close()
