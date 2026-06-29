import os
import sys
from dotenv import load_dotenv
from sqlalchemy import text, create_engine
from sqlalchemy.orm import Session

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models.parent import Parent
from app.models.student import Student
from app.models.staff import Staff
from app.models.admin import Admin

def run_migration():
    db = SessionLocal()
    try:
        print("Starting DB migration...")
        
        # 1. Drop the unique constraint/index on phone_number if it exists
        # In PostgreSQL, we can check for unique constraints and indexes and drop them.
        with engine.begin() as conn:
            print("Dropping existing unique constraints and indexes on users(phone_number)...")
            
            # Find constraint name for phone_number unique constraint
            query = """
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'users'::regclass AND contype = 'u';
            """
            constraints = conn.execute(text(query)).fetchall()
            for r in constraints:
                conname = r[0]
                print(f"Dropping constraint: {conname}")
                conn.execute(text(f"ALTER TABLE users DROP CONSTRAINT IF EXISTS {conname} CASCADE;"))
                
            # Also drop index if it is unique
            conn.execute(text("DROP INDEX IF EXISTS ix_users_phone_number CASCADE;"))
            
            # Recreate non-unique index for performance
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_phone_number ON users(phone_number);"))
            
            # 2. Add columns to users table if they don't exist
            print("Adding columns student_id, staff_id, admin_id to users...")
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id VARCHAR;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS staff_id VARCHAR;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_id VARCHAR;"))
            
            # 3. Create composite unique index on users(phone_number, role)
            print("Creating composite unique index on users(phone_number, role)...")
            conn.execute(text("DROP INDEX IF EXISTS uq_users_phone_role CASCADE;"))
            conn.execute(text("CREATE UNIQUE INDEX uq_users_phone_role ON users(phone_number, role);"))
            
            # 4. Create staff table
            print("Creating staff table...")
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS staff (
                staff_id VARCHAR PRIMARY KEY,
                first_name VARCHAR NOT NULL,
                last_name VARCHAR NOT NULL,
                email VARCHAR UNIQUE,
                phone VARCHAR UNIQUE,
                department VARCHAR,
                profile_image_url VARCHAR
            );
            """))
            
            # 5. Create admins table
            print("Creating admins table...")
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS admins (
                admin_id VARCHAR PRIMARY KEY,
                first_name VARCHAR NOT NULL,
                last_name VARCHAR NOT NULL,
                email VARCHAR UNIQUE,
                phone VARCHAR UNIQUE,
                permissions VARCHAR,
                profile_image_url VARCHAR
            );
            """))
            
        print("Schema altered successfully. Now seeding mock users...")
        
        # 6. Seed Admin
        admin_phone = "1234567890"
        admin_record = db.query(Admin).filter(Admin.admin_id == "ADM001").first()
        if not admin_record:
            admin_record = Admin(
                admin_id="ADM001",
                first_name="Admin",
                last_name="One",
                phone=admin_phone,
                email="admin.one@greenparkschool.com",
                permissions="all"
            )
            db.add(admin_record)
            db.commit()
            print(" [+] Seeded admin record ADM001")
            
        admin_user = db.query(User).filter(User.phone_number == admin_phone, User.role == "admin").first()
        if not admin_user:
            admin_user = User(
                phone_number=admin_phone,
                password=get_password_hash("admin123"),
                role="admin",
                admin_id="ADM001"
            )
            db.add(admin_user)
            db.commit()
            print(" [+] Seeded admin user login")
        else:
            admin_user.admin_id = "ADM001"
            db.commit()
            print(" [!] Updated existing admin user login with admin_id")

        # 7. Seed Staff
        staff_phone = "9876543210"
        staff_record = db.query(Staff).filter(Staff.staff_id == "STF001").first()
        if not staff_record:
            staff_record = Staff(
                staff_id="STF001",
                first_name="John",
                last_name="Doe",
                phone=staff_phone,
                email="john.doe@greenparkschool.com",
                department="Science"
            )
            db.add(staff_record)
            db.commit()
            print(" [+] Seeded staff record STF001")
            
        staff_user = db.query(User).filter(User.phone_number == staff_phone, User.role == "staff").first()
        if not staff_user:
            staff_user = User(
                phone_number=staff_phone,
                password=get_password_hash("password123"),
                role="staff",
                staff_id="STF001"
            )
            db.add(staff_user)
            db.commit()
            print(" [+] Seeded staff user login")

        # 8. Seed Student logins for existing students
        students = db.query(Student).all()
        print(f"Syncing logins for {len(students)} students...")
        
        seeded_students_count = 0
        for student in students:
            # Find the parent's phone number to associate with the student login
            parent = db.query(Parent).filter(Parent.parent_id == student.parent_id).first()
            if not parent or not parent.phone_primary:
                print(f" [!] Skipping student {student.student_id}: parent/phone not found")
                continue
                
            student_phone = str(parent.phone_primary).strip()
            
            # Check if this student already has a user account
            existing_student_user = db.query(User).filter(User.student_id == student.student_id).first()
            if not existing_student_user:
                # Create student login (sharing the parent's phone number but with password 'password123')
                new_student_user = User(
                    phone_number=student_phone,
                    password=get_password_hash("password123"),
                    role="student",
                    student_id=student.student_id
                )
                db.add(new_student_user)
                seeded_students_count += 1
                print(f" [+] Created student login: {student.first_name} {student.last_name} ({student_phone})")
                
        db.commit()
        print(f"Done! Seeded {seeded_students_count} student logins.")
        print("Migration complete!")
        
    except Exception as e:
        db.rollback()
        print(f"ERROR DURING MIGRATION: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
