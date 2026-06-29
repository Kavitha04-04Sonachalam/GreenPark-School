import os
import sys
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.orm import Session

# Add parent dir to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine
from app.models.academic_year import AcademicYear
from app.models.fee_head import FeeHead
from app.models.fee_structure import FeeStructure
from app.models.fee_structure_item import FeeStructureItem
from app.models.student import Student
from app.models.user import User
from app.models.scholarship import Scholarship
from app.models.scholarship_posting import ScholarshipPosting
from app.services.fees_service import assign_fee_structure_to_student

def run_migration():
    db = SessionLocal()
    try:
        print("Starting new Fee ERP database migration...")

        with engine.begin() as conn:
            print("Cleaning up old tables and constraint drops...")
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS can_collect_fee BOOLEAN DEFAULT FALSE;"))
            
            # Drop tables to clear old schemas
            conn.execute(text("DROP TABLE IF EXISTS fee_payments CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS scholarship_postings CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS scholarships CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS student_fee_assignment_items CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS student_fee_assignments CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS fee_structure_items CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS fee_structures CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS fee_categories CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS terms CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS fee_heads CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS academic_years CASCADE;"))

            print("Creating academic_years table...")
            conn.execute(text("""
            CREATE TABLE academic_years (
                id SERIAL PRIMARY KEY,
                name VARCHAR UNIQUE NOT NULL,
                is_active BOOLEAN DEFAULT TRUE
            );
            """))

            print("Creating fee_heads table...")
            conn.execute(text("""
            CREATE TABLE fee_heads (
                id SERIAL PRIMARY KEY,
                name VARCHAR UNIQUE NOT NULL,
                is_active BOOLEAN DEFAULT TRUE
            );
            """))

            print("Creating fee_structures table...")
            conn.execute(text("""
            CREATE TABLE fee_structures (
                id SERIAL PRIMARY KEY,
                academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
                class_name VARCHAR NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
                CONSTRAINT uq_academic_year_class UNIQUE (academic_year_id, class_name)
            );
            """))

            print("Creating fee_structure_items table...")
            conn.execute(text("""
            CREATE TABLE fee_structure_items (
                id SERIAL PRIMARY KEY,
                fee_structure_id INTEGER REFERENCES fee_structures(id) ON DELETE CASCADE,
                fee_head_id INTEGER REFERENCES fee_heads(id) ON DELETE CASCADE,
                term VARCHAR NOT NULL,
                amount DOUBLE PRECISION DEFAULT 0.0,
                CONSTRAINT uq_structure_head_term UNIQUE (fee_structure_id, fee_head_id, term)
            );
            """))

            print("Creating student_fee_assignments table...")
            conn.execute(text("""
            CREATE TABLE student_fee_assignments (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR REFERENCES students(student_id) ON DELETE CASCADE,
                academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
                fee_structure_id INTEGER REFERENCES fee_structures(id) ON DELETE CASCADE,
                CONSTRAINT uq_student_academic_year UNIQUE (student_id, academic_year_id)
            );
            """))

            print("Creating student_fee_assignment_items table...")
            conn.execute(text("""
            CREATE TABLE student_fee_assignment_items (
                id SERIAL PRIMARY KEY,
                student_fee_assignment_id INTEGER REFERENCES student_fee_assignments(id) ON DELETE CASCADE,
                fee_structure_item_id INTEGER REFERENCES fee_structure_items(id) ON DELETE CASCADE,
                waiver_amount DOUBLE PRECISION DEFAULT 0.0,
                late_fee_amount DOUBLE PRECISION DEFAULT 0.0,
                status VARCHAR DEFAULT 'Pending',
                CONSTRAINT uq_assignment_structure_item UNIQUE (student_fee_assignment_id, fee_structure_item_id)
            );
            """))

            print("Creating scholarships table...")
            conn.execute(text("""
            CREATE TABLE scholarships (
                id SERIAL PRIMARY KEY,
                name VARCHAR UNIQUE NOT NULL,
                discount_type VARCHAR NOT NULL,
                discount_value DOUBLE PRECISION NOT NULL,
                is_active BOOLEAN DEFAULT TRUE
            );
            """))

            print("Creating scholarship_postings table...")
            conn.execute(text("""
            CREATE TABLE scholarship_postings (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR REFERENCES students(student_id) ON DELETE CASCADE,
                scholarship_id INTEGER REFERENCES scholarships(id) ON DELETE CASCADE,
                academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
                approved_by_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
                CONSTRAINT uq_student_scholarship_year_id UNIQUE (student_id, scholarship_id, academic_year_id)
            );
            """))

            print("Creating fee_payments table...")
            conn.execute(text("""
            CREATE TABLE fee_payments (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR REFERENCES students(student_id) ON DELETE CASCADE,
                fee_structure_item_id INTEGER REFERENCES fee_structure_items(id) ON DELETE CASCADE,
                receipt_no VARCHAR NOT NULL,
                payment_date TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
                amount_paid DOUBLE PRECISION DEFAULT 0.0,
                payment_mode VARCHAR NOT NULL,
                cash_amount DOUBLE PRECISION DEFAULT 0.0,
                upi_amount DOUBLE PRECISION DEFAULT 0.0,
                card_amount DOUBLE PRECISION DEFAULT 0.0,
                paid_by VARCHAR NOT NULL,
                collected_by_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
                scholarship_id INTEGER REFERENCES scholarships(id) ON DELETE SET NULL,
                remarks TEXT,
                balance_after DOUBLE PRECISION DEFAULT 0.0
            );
            """))

        print("Schemas initialized. Seeding metadata and structures...")

        # 1. Seed Academic Years
        ay1 = AcademicYear(name="2026-2027", is_active=True)
        ay2 = AcademicYear(name="2027-2028", is_active=False)
        db.add_all([ay1, ay2])
        db.commit()
        db.refresh(ay1)
        db.refresh(ay2)
        print(f" [+] Seeded Academic Years: {ay1.name} (active), {ay2.name}")

        # 2. Seed Fee Heads
        heads = [
            "Course Fee", "Bag & Book Fee", "Miscellaneous Fee", "Transportation Fee",
            "Lab Fee", "Exam Fee", "Sports Fee", "Hostel Fee"
        ]
        head_objs = {}
        for h in heads:
            fh = FeeHead(name=h, is_active=True)
            db.add(fh)
            db.commit()
            db.refresh(fh)
            head_objs[h] = fh
        print(f" [+] Seeded {len(heads)} Fee Heads")

        # 3. Seed Fee Structures & Items for 2026-27 (LKG to XII)
        seed_fees = {
            "LKG": 27000.0, "UKG": 28000.0, "1": 29000.0, "2": 30000.0,
            "3": 31000.0, "4": 32000.0, "5": 33000.0, "6": 34000.0,
            "7": 35000.0, "8": 36000.0, "9": 37000.0, "10": 38000.0,
            "11": 39000.0, "12": 40000.0
        }

        for class_name, total_amount in seed_fees.items():
            struct = FeeStructure(academic_year_id=ay1.id, class_name=class_name, is_active=True)
            db.add(struct)
            db.commit()
            db.refresh(struct)

            items_to_add = []
            if class_name in ["LKG", "UKG"]:
                # LKG & UKG Breakdown rules
                course_fee = 15000.0 if class_name == "LKG" else 16000.0
                bag_book = 4000.0
                misc = 3000.0
                transport = 5000.0

                # Term Breakups
                # Course fee split across terms
                items_to_add.append(FeeStructureItem(fee_structure_id=struct.id, fee_head_id=head_objs["Course Fee"].id, term="I Term", amount=course_fee * 0.4))
                items_to_add.append(FeeStructureItem(fee_structure_id=struct.id, fee_head_id=head_objs["Course Fee"].id, term="II Term", amount=course_fee * 0.3))
                items_to_add.append(FeeStructureItem(fee_structure_id=struct.id, fee_head_id=head_objs["Course Fee"].id, term="III Term", amount=course_fee * 0.3))
                
                # Bag & book is single term
                items_to_add.append(FeeStructureItem(fee_structure_id=struct.id, fee_head_id=head_objs["Bag & Book Fee"].id, term="I Term", amount=bag_book))

                # Misc split
                items_to_add.append(FeeStructureItem(fee_structure_id=struct.id, fee_head_id=head_objs["Miscellaneous Fee"].id, term="I Term", amount=misc * 0.4))
                items_to_add.append(FeeStructureItem(fee_structure_id=struct.id, fee_head_id=head_objs["Miscellaneous Fee"].id, term="II Term", amount=misc * 0.3))
                items_to_add.append(FeeStructureItem(fee_structure_id=struct.id, fee_head_id=head_objs["Miscellaneous Fee"].id, term="III Term", amount=misc * 0.3))

                # Transport split
                items_to_add.append(FeeStructureItem(fee_structure_id=struct.id, fee_head_id=head_objs["Transportation Fee"].id, term="I Term", amount=2000.0))
                items_to_add.append(FeeStructureItem(fee_structure_id=struct.id, fee_head_id=head_objs["Transportation Fee"].id, term="II Term", amount=1500.0))
                items_to_add.append(FeeStructureItem(fee_structure_id=struct.id, fee_head_id=head_objs["Transportation Fee"].id, term="III Term", amount=1500.0))
            else:
                # Classes I-XII Breakdown rules
                bag_book = 5000.0 if int(class_name) <= 8 else 6000.0
                misc = 4000.0
                course_fee = total_amount - bag_book - misc

                # Course fee split
                items_to_add.append(FeeStructureItem(fee_structure_id=struct.id, fee_head_id=head_objs["Course Fee"].id, term="I Term", amount=course_fee * 0.4))
                items_to_add.append(FeeStructureItem(fee_structure_id=struct.id, fee_head_id=head_objs["Course Fee"].id, term="II Term", amount=course_fee * 0.3))
                items_to_add.append(FeeStructureItem(fee_structure_id=struct.id, fee_head_id=head_objs["Course Fee"].id, term="III Term", amount=course_fee * 0.3))
                
                # Bag & book term
                items_to_add.append(FeeStructureItem(fee_structure_id=struct.id, fee_head_id=head_objs["Bag & Book Fee"].id, term="I Term", amount=bag_book))

                # Misc split
                items_to_add.append(FeeStructureItem(fee_structure_id=struct.id, fee_head_id=head_objs["Miscellaneous Fee"].id, term="I Term", amount=misc * 0.4))
                items_to_add.append(FeeStructureItem(fee_structure_id=struct.id, fee_head_id=head_objs["Miscellaneous Fee"].id, term="II Term", amount=misc * 0.3))
                items_to_add.append(FeeStructureItem(fee_structure_id=struct.id, fee_head_id=head_objs["Miscellaneous Fee"].id, term="III Term", amount=misc * 0.3))

            db.add_all(items_to_add)
            db.commit()

        print(" [+] Seeded Fee structures (LKG to XII) and breakups")

        # 4. Seed Scholarships
        sc_merit = Scholarship(name="Merit Scholarship (50%)", discount_type="percent", discount_value=50.0, is_active=True)
        sc_sports = Scholarship(name="Sports Scholarship (Flat 3000)", discount_type="flat", discount_value=3000.0, is_active=True)
        sc_full = Scholarship(name="Full Staff Ward Scholarship", discount_type="percent", discount_value=100.0, is_active=True)
        db.add_all([sc_merit, sc_sports, sc_full])
        db.commit()
        db.refresh(sc_merit)
        db.refresh(sc_sports)
        print(" [+] Seeded initial scholarships")

        # 5. Automatically assign fee structures to all 19 students
        students = db.query(Student).all()
        for s in students:
            # Map student class (e.g. "VII" or "7") to match standard keys
            class_key = s.class_.strip()
            if class_key == "VII":
                class_key = "7"
            
            struct = db.query(FeeStructure).filter_by(
                academic_year_id=ay1.id,
                class_name=class_key
            ).first()
            if struct:
                try:
                    assign_fee_structure_to_student(db, s.student_id, ay1.id, struct.id)
                except Exception as e:
                    print(f"  [!] Failed auto-assigning for student {s.student_id}: {e}")
            else:
                print(f"  [!] No fee structure found for class '{class_key}' to assign to student {s.student_id}")

        print(" [+] Auto-assigned structures to active student base")

        # 6. Assign Scholarships to a couple of students for testing
        admin_user = db.query(User).filter(User.role == "admin").first()
        admin_id = admin_user.user_id if admin_user else None
        if len(students) >= 2 and admin_id:
            sp1 = ScholarshipPosting(student_id=students[0].student_id, scholarship_id=sc_merit.id, academic_year_id=ay1.id, approved_by_user_id=admin_id)
            sp2 = ScholarshipPosting(student_id=students[1].student_id, scholarship_id=sc_sports.id, academic_year_id=ay1.id, approved_by_user_id=admin_id)
            db.add_all([sp1, sp2])
            db.commit()
            print(f" [+] Assigned Merit Scholarship to Student: {students[0].first_name} {students[0].last_name}")
            print(f" [+] Assigned Sports Scholarship to Student: {students[1].first_name} {students[1].last_name}")

        # 7. Grant fee collection permissions to Staff
        staff_user = db.query(User).filter(User.phone_number == "9876543210", User.role == "staff").first()
        if staff_user:
            staff_user.can_collect_fee = True
            db.commit()
            print(" [+] Enabled can_collect_fee permission for staff user (Phone: 9876543210)")

        print("Fee ERP database migration completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"ERROR executing migration: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
