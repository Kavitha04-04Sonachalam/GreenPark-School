import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import date
from sqlalchemy import text
from app.core.database import SessionLocal, engine
from app.models.staff import Staff
from app.models.user import User
from app.core.security import get_password_hash

def run_migration():
    db = SessionLocal()
    try:
        print("Migrating staff table columns...")
        
        # 1. Drop existing staff table
        with engine.begin() as conn:
            print("Dropping old staff table if exists...")
            conn.execute(text("DROP TABLE IF EXISTS staff CASCADE;"))
            
            # 2. Recreate staff table with new columns
            print("Recreating staff table with new columns...")
            conn.execute(text("""
            CREATE TABLE staff (
                id SERIAL PRIMARY KEY,
                employee_id VARCHAR UNIQUE NOT NULL,
                employee_name VARCHAR NOT NULL,
                gender VARCHAR NOT NULL,
                mobile_no VARCHAR UNIQUE NOT NULL,
                designation VARCHAR NOT NULL,
                date_of_joining DATE NOT NULL,
                door_no VARCHAR,
                street_name VARCHAR,
                state VARCHAR,
                district VARCHAR,
                pincode VARCHAR,
                access_rights VARCHAR,
                user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                
                -- Legacy compatibility columns
                staff_id VARCHAR UNIQUE,
                first_name VARCHAR,
                last_name VARCHAR,
                email VARCHAR,
                phone VARCHAR UNIQUE,
                department VARCHAR,
                profile_image_url VARCHAR
            );
            """))
        
        # 3. Seed/Restore default staff John Doe user (STF001, phone: 9876543210)
        print("Re-seeding mock staff user STF001...")
        
        # Check if login exists
        staff_phone = "9876543210"
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
            db.refresh(staff_user)
            print(f" [+] Created mock staff user account (user_id: {staff_user.user_id})")
        else:
            staff_user.staff_id = "STF001"
            db.commit()
            print(f" [+] Found existing staff user account (user_id: {staff_user.user_id})")
            
        # Create Staff record
        staff_record = Staff(
            employee_id="STF001",
            employee_name="John Doe",
            gender="Male",
            mobile_no=staff_phone,
            designation="Teacher",
            date_of_joining=date(2020, 6, 1),
            door_no="12",
            street_name="Main Street",
            state="Tamil Nadu",
            district="Perambalur",
            pincode="621113",
            access_rights="Science",
            user_id=staff_user.user_id,
            is_active=True,
            
            # Compatibility fields
            staff_id="STF001",
            first_name="John",
            last_name="Doe",
            email="john.doe@greenparkschool.com",
            phone=staff_phone,
            department="Science"
        )
        db.add(staff_record)
        db.commit()
        print(" [+] Seeded mock staff STF001 record successfully.")
        print("Migration complete!")
        
    except Exception as e:
        db.rollback()
        print(f"[!] Migration failed: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
