from app.core.database import SessionLocal
from app.models.user import User
from app.models.parent import Parent
from app.core.security import get_password_hash
import sys

def seed_all_parents():
    db = SessionLocal()
    try:
        # 1. Fetch all records from parents table
        parents = db.query(Parent).all()
        print(f"Syncing {len(parents)} parents to users table...")

        count_created = 0
        count_skipped = 0
        
        for parent in parents:
            if not parent.phone_primary:
                print(f"Skipping parent {parent.parent_id} - No phone number found.")
                continue
                
            # Clean and trim the phone number
            phone = str(parent.phone_primary).strip()
            
            # 2. Check if a user exists with the same phone number
            existing_user = db.query(User).filter(User.phone_number == phone, User.role == "parent").first()
            
            if not existing_user:
                # 3. Create a new user with default password
                new_user = User(
                    phone_number=phone,
                    password=get_password_hash("password123"),
                    role="parent",
                    parent_id=parent.parent_id
                )
                db.add(new_user)
                count_created += 1
                print(f" [+] Created account for parent: {phone}")
            else:
                # 3b. FORCE RESET password to password123 for existing users
                existing_user.password = get_password_hash("password123")
                count_skipped += 1
                print(f" [!] Reset password for existing parent: {phone}")
        
        db.commit()
        print(f"\nDone! Summary:")
        print(f" - New users created: {count_created}")
        print(f" - Existing users skipped: {count_skipped}")
        print(f"Default login for parents: phone number / password123")
        
    except Exception as e:
        db.rollback()
        print(f"ERROR: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_all_parents()
