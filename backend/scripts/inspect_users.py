from app.core.database import SessionLocal
from app.models.user import User
from sqlalchemy import text

def inspect_users():
    db = SessionLocal()
    try:
        # Check parent users
        users = db.query(User).filter(User.role == "parent").all()
        print(f"Total parent users found in 'users' table: {len(users)}")
        
        if len(users) > 0:
            print("\nFirst 5 parent users details:")
            for u in users[:5]:
                print(f" - Phone: {u.phone_number}, Role: {u.role}, ParentID: {u.parent_id}")
        else:
            print("No parent users found!")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_users()
