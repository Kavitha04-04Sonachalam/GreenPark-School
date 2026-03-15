from app.core.database import SessionLocal
from app.models.user import User
from app.models.parent import Parent
from app.core.security import get_password_hash

def seed_test_user():
    db = SessionLocal()
    # Find the parent PAR001
    parent = db.query(Parent).filter(Parent.parent_id == "PAR001").first()
    if not parent:
        print("Parent PAR001 not found!")
        return

    # Check if user already exists
    user = db.query(User).filter(User.phone_number == str(parent.phone_primary)).first()
    if not user:
        new_user = User(
            phone_number=str(parent.phone_primary),
            password=get_password_hash("password123"),
            role="parent",
            parent_id=parent.parent_id
        )
        db.add(new_user)
        db.commit()
        print(f"Parent user created for {parent.father_name}: {parent.phone_primary} / password123")
    else:
        print(f"User for {parent.phone_primary} already exists.")
    db.close()

if __name__ == "__main__":
    seed_test_user()
