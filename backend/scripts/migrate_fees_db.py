import os
import sys
from dotenv import load_dotenv
from sqlalchemy import text, create_engine
from sqlalchemy.orm import Session

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine
from app.models.user import User
from app.models.student import Student
from app.models.term import Term
from app.models.fee_category import FeeCategory
from app.models.fee_structure import FeeStructure
from app.models.scholarship import Scholarship
from app.models.scholarship_posting import ScholarshipPosting
from app.models.fee_payment import FeePayment

def run_migration():
    db = SessionLocal()
    try:
        print("Starting fees database migration...")
        
        # 1. Update users table with can_collect_fee column
        with engine.begin() as conn:
            print("Altering users table to add can_collect_fee column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS can_collect_fee BOOLEAN DEFAULT FALSE;"))
            
            # Recreate new tables to match Phase 2 requirements (clean drop if exists to ensure schema consistency)
            print("Recreating fee system tables to match ERP requirements...")
            
            # Disable FK check momentarily to clean up old structures if needed
            conn.execute(text("DROP TABLE IF EXISTS fee_payments CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS scholarship_postings CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS scholarships CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS fee_components CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS fee_structures CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS fee_categories CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS terms CASCADE;"))
            
            print("Creating terms table...")
            conn.execute(text("""
            CREATE TABLE terms (
                id SERIAL PRIMARY KEY,
                name VARCHAR NOT NULL,
                academic_year VARCHAR NOT NULL
            );
            """))
            
            print("Creating fee_categories table...")
            conn.execute(text("""
            CREATE TABLE fee_categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR UNIQUE NOT NULL,
                is_active BOOLEAN DEFAULT TRUE
            );
            """))
            
            print("Creating fee_structures table...")
            conn.execute(text("""
            CREATE TABLE fee_structures (
                id SERIAL PRIMARY KEY,
                academic_year VARCHAR NOT NULL,
                class_name VARCHAR NOT NULL,
                term_id INTEGER REFERENCES terms(id) ON DELETE CASCADE,
                category_id INTEGER REFERENCES fee_categories(id) ON DELETE CASCADE,
                amount DOUBLE PRECISION DEFAULT 0.0,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
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
                academic_year VARCHAR NOT NULL,
                approved_by_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
                CONSTRAINT uq_student_scholarship_year UNIQUE (student_id, scholarship_id, academic_year)
            );
            """))
            
            print("Creating fee_payments table...")
            conn.execute(text("""
            CREATE TABLE fee_payments (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR REFERENCES students(student_id) ON DELETE CASCADE,
                fee_structure_id INTEGER REFERENCES fee_structures(id) ON DELETE CASCADE,
                receipt_no VARCHAR UNIQUE NOT NULL,
                payment_date TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
                amount_paid DOUBLE PRECISION DEFAULT 0.0,
                payment_mode VARCHAR NOT NULL,
                cash_amount DOUBLE PRECISION DEFAULT 0.0,
                upi_amount DOUBLE PRECISION DEFAULT 0.0,
                card_amount DOUBLE PRECISION DEFAULT 0.0,
                paid_by VARCHAR NOT NULL,
                collected_by_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
                scholarship_id INTEGER REFERENCES scholarships(id) ON DELETE SET NULL,
                balance_after DOUBLE PRECISION DEFAULT 0.0
            );
            """))
            
        print("Schema setup completed successfully. Seeding initial data...")
        
        # 2. Seed Terms
        term1 = Term(name="Term 1", academic_year="2024-25")
        term2 = Term(name="Term 2", academic_year="2024-25")
        term3 = Term(name="Term 3", academic_year="2024-25")
        db.add_all([term1, term2, term3])
        db.commit()
        db.refresh(term1)
        db.refresh(term2)
        db.refresh(term3)
        print(f" [+] Seeded terms: {term1.id}, {term2.id}, {term3.id}")
        
        # 3. Seed Fee Categories
        cat_tuition = FeeCategory(name="Tuition Fee", is_active=True)
        cat_transport = FeeCategory(name="Transport Fee", is_active=True)
        cat_books = FeeCategory(name="Books", is_active=True)
        cat_exam = FeeCategory(name="Exam Fee", is_active=True)
        cat_uniform = FeeCategory(name="Uniform", is_active=True)
        db.add_all([cat_tuition, cat_transport, cat_books, cat_exam, cat_uniform])
        db.commit()
        db.refresh(cat_tuition)
        db.refresh(cat_exam)
        db.refresh(cat_books)
        print(f" [+] Seeded fee categories")
        
        # 4. Seed Fee Structures
        classes = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
        structures_count = 0
        for c in classes:
            # Tuition for Term 1, 2, 3
            t1_tuition = FeeStructure(academic_year="2024-25", class_name=c, term_id=term1.id, category_id=cat_tuition.id, amount=12000.0)
            t2_tuition = FeeStructure(academic_year="2024-25", class_name=c, term_id=term2.id, category_id=cat_tuition.id, amount=12000.0)
            t3_tuition = FeeStructure(academic_year="2024-25", class_name=c, term_id=term3.id, category_id=cat_tuition.id, amount=12000.0)
            
            # Exam Fee for Term 1, 2
            t1_exam = FeeStructure(academic_year="2024-25", class_name=c, term_id=term1.id, category_id=cat_exam.id, amount=1500.0)
            t2_exam = FeeStructure(academic_year="2024-25", class_name=c, term_id=term2.id, category_id=cat_exam.id, amount=1500.0)
            
            # Books for Term 1
            t1_books = FeeStructure(academic_year="2024-25", class_name=c, term_id=term1.id, category_id=cat_books.id, amount=3000.0)
            
            db.add_all([t1_tuition, t2_tuition, t3_tuition, t1_exam, t2_exam, t1_books])
            structures_count += 6
            
        db.commit()
        print(f" [+] Seeded {structures_count} class-wise fee structures")
        
        # 5. Seed Scholarships
        sc_merit = Scholarship(name="Merit Scholarship (50%)", discount_type="percent", discount_value=50.0, is_active=True)
        sc_sports = Scholarship(name="Sports Scholarship (Flat 3000)", discount_type="flat", discount_value=3000.0, is_active=True)
        sc_full = Scholarship(name="Full Staff Ward Scholarship", discount_type="percent", discount_value=100.0, is_active=True)
        db.add_all([sc_merit, sc_sports, sc_full])
        db.commit()
        db.refresh(sc_merit)
        db.refresh(sc_sports)
        print(f" [+] Seeded scholarships")
        
        # 6. Assign Scholarships to a couple of students for testing
        students = db.query(Student).limit(2).all()
        admin_user = db.query(User).filter(User.role == "admin").first()
        admin_id = admin_user.user_id if admin_user else None
        
        if len(students) >= 2 and admin_id:
            sp1 = ScholarshipPosting(student_id=students[0].student_id, scholarship_id=sc_merit.id, academic_year="2024-25", approved_by_user_id=admin_id)
            sp2 = ScholarshipPosting(student_id=students[1].student_id, scholarship_id=sc_sports.id, academic_year="2024-25", approved_by_user_id=admin_id)
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
            
        print("Fees Database Migration completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"ERROR: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
