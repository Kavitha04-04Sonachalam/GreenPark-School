import os
import sys
import argparse
from sqlalchemy import text
from sqlalchemy.orm import Session

# Add parent dir to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine
from app.models.academic_year import AcademicYear
from app.models.term import Term
from app.models.fee_category import FeeCategory
from app.models.fee_structure import FeeStructure
from app.models.fee_payment import FeePayment

def get_or_create_category(db: Session, name: str):
    cat = db.query(FeeCategory).filter(FeeCategory.category_name == name).first()
    if not cat:
        cat = FeeCategory(category_name=name)
        db.add(cat)
        db.commit()
        db.refresh(cat)
    return cat

def run_seeding(reset: bool):
    db = SessionLocal()
    try:
        print("Starting Fee Structure Seeding...")
        
        # 1. Resolve Academic Year
        ay = db.query(AcademicYear).filter(AcademicYear.status == "ACTIVE").first()
        if not ay:
            ay = db.query(AcademicYear).first()
        if not ay:
            print("[!] No Academic Years found in database. Please configure one first.")
            return
        
        print(f" [+] Using Academic Year: {ay.year_name} (ID: {ay.year_id})")

        # 2. Resolve Terms
        t1 = db.query(Term).filter(Term.term_name == "Term 1").first()
        t2 = db.query(Term).filter(Term.term_name == "Term 2").first()
        t3 = db.query(Term).filter(Term.term_name == "Term 3").first()
        
        if not (t1 and t2 and t3):
            print("[!] Could not resolve Term 1, Term 2, and Term 3 in the terms table.")
            return
        
        print(f" [+] Resolved Terms - Term 1 ID: {t1.term_id}, Term 2 ID: {t2.term_id}, Term 3 ID: {t3.term_id}")

        # 3. Handle Reset / Clean up
        if reset:
            print(" [!] Reset flag active. Clearing existing payments and structures for this academic year...")
            # Drop payments linking to structures in this year
            struct_ids_query = db.query(FeeStructure.id).filter(FeeStructure.academic_year_id == ay.year_id).subquery()
            db.query(FeePayment).filter(FeePayment.fee_structure_id.in_(struct_ids_query)).delete(synchronize_session=False)
            db.query(FeeStructure).filter(FeeStructure.academic_year_id == ay.year_id).delete(synchronize_session=False)
            db.commit()
            print(" [+] Cleaned up structures and payment ledger.")

        # 4. Resolve / Create Categories
        c_course = get_or_create_category(db, "Course Fee")
        c_books = get_or_create_category(db, "Bag & Book Fee")
        c_misc = get_or_create_category(db, "Miscellaneous Fee")
        c_transport = get_or_create_category(db, "Transportation Fee")
        
        print(" [+] Resolved categories successfully.")

        # 5. Define classes and total amounts
        # LKG: 27000, UKG: 28000, 1: 29000 ... 12: 40000
        classes = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
        fee_totals = {
            "LKG": 27000.0, "UKG": 28000.0, "1": 29000.0, "2": 30000.0,
            "3": 31000.0, "4": 32000.0, "5": 33000.0, "6": 34000.0,
            "7": 35000.0, "8": 36000.0, "9": 37000.0, "10": 38000.0,
            "11": 39000.0, "12": 40000.0
        }

        # 6. Seed structures class by class
        seeded_count = 0
        skipped_count = 0

        for cls in classes:
            # Check if any structures already exist for this class/year
            exists = db.query(FeeStructure).filter_by(academic_year_id=ay.year_id, school_class=cls).first()
            if exists and not reset:
                print(f" [-] Skip: Fee structures already configured for Class {cls}. Use --reset to overwrite.")
                skipped_count += 1
                continue

            total_amount = fee_totals[cls]
            items = []

            if cls in ["LKG", "UKG"]:
                # LKG/UKG Splits: Course Fee (15k/16k), Books (4k), Misc (3k), Transport (5k)
                course_total = 15000.0 if cls == "LKG" else 16000.0
                books_total = 4000.0
                misc_total = 3000.0
                transport_total = 5000.0

                # Term splits
                # Term 1 (40% Course, 100% Books, 40% Misc, 40% Transport)
                items.append(FeeStructure(academic_year_id=ay.year_id, school_class=cls, term_id=t1.term_id, category_id=c_course.category_id, amount=course_total * 0.40))
                items.append(FeeStructure(academic_year_id=ay.year_id, school_class=cls, term_id=t1.term_id, category_id=c_books.category_id, amount=books_total))
                items.append(FeeStructure(academic_year_id=ay.year_id, school_class=cls, term_id=t1.term_id, category_id=c_misc.category_id, amount=misc_total * 0.40))
                items.append(FeeStructure(academic_year_id=ay.year_id, school_class=cls, term_id=t1.term_id, category_id=c_transport.category_id, amount=transport_total * 0.40))

                # Term 2 (30% Course, 30% Misc, 30% Transport)
                items.append(FeeStructure(academic_year_id=ay.year_id, school_class=cls, term_id=t2.term_id, category_id=c_course.category_id, amount=course_total * 0.30))
                items.append(FeeStructure(academic_year_id=ay.year_id, school_class=cls, term_id=t2.term_id, category_id=c_misc.category_id, amount=misc_total * 0.30))
                items.append(FeeStructure(academic_year_id=ay.year_id, school_class=cls, term_id=t2.term_id, category_id=c_transport.category_id, amount=transport_total * 0.30))

                # Term 3 (30% Course, 30% Misc, 30% Transport)
                items.append(FeeStructure(academic_year_id=ay.year_id, school_class=cls, term_id=t3.term_id, category_id=c_course.category_id, amount=course_total * 0.30))
                items.append(FeeStructure(academic_year_id=ay.year_id, school_class=cls, term_id=t3.term_id, category_id=c_misc.category_id, amount=misc_total * 0.30))
                items.append(FeeStructure(academic_year_id=ay.year_id, school_class=cls, term_id=t3.term_id, category_id=c_transport.category_id, amount=transport_total * 0.30))

            else:
                # Classes I-XII Splits: Books (5k/6k), Misc (4k), Course Fee (Balance)
                # Classes <= 8 get 5k Books; Classes > 8 get 6k Books
                is_senior = cls in ["9", "10", "11", "12"]
                books_total = 6000.0 if is_senior else 5000.0
                misc_total = 4000.0
                course_total = total_amount - books_total - misc_total

                # Term splits
                # Term 1 (40% Course, 100% Books, 40% Misc)
                items.append(FeeStructure(academic_year_id=ay.year_id, school_class=cls, term_id=t1.term_id, category_id=c_course.category_id, amount=course_total * 0.40))
                items.append(FeeStructure(academic_year_id=ay.year_id, school_class=cls, term_id=t1.term_id, category_id=c_books.category_id, amount=books_total))
                items.append(FeeStructure(academic_year_id=ay.year_id, school_class=cls, term_id=t1.term_id, category_id=c_misc.category_id, amount=misc_total * 0.40))

                # Term 2 (30% Course, 30% Misc)
                items.append(FeeStructure(academic_year_id=ay.year_id, school_class=cls, term_id=t2.term_id, category_id=c_course.category_id, amount=course_total * 0.30))
                items.append(FeeStructure(academic_year_id=ay.year_id, school_class=cls, term_id=t2.term_id, category_id=c_misc.category_id, amount=misc_total * 0.30))

                # Term 3 (30% Course, 30% Misc)
                items.append(FeeStructure(academic_year_id=ay.year_id, school_class=cls, term_id=t3.term_id, category_id=c_course.category_id, amount=course_total * 0.30))
                items.append(FeeStructure(academic_year_id=ay.year_id, school_class=cls, term_id=t3.term_id, category_id=c_misc.category_id, amount=misc_total * 0.30))

            db.add_all(items)
            db.commit()
            seeded_count += len(items)
            print(f" [+] Seeded: Configured {len(items)} items for Class {cls} (Total: Rs. {total_amount:,.2f})")

        print(f"Seeding finished. Added {seeded_count} structures. Skipped {skipped_count} classes.")

    except Exception as e:
        db.rollback()
        print(f"[!] Seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed school fee structures.")
    parser.add_argument("--reset", action="store_true", help="Delete existing structures and payments for the active year before seeding.")
    args = parser.parse_args()
    run_seeding(args.reset)
