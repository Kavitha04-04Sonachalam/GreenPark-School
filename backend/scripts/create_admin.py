from app.core.database import SessionLocal, engine
from app.models import User, Base
from app.core.security import get_password_hash

def create_admin():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    # Check if admin already exists
    admin = db.query(User).filter(User.phone_number == "1234567890").first()
    if not admin:
        new_admin = User(
            phone_number="1234567890",
            password=get_password_hash("admin123"),
            role="admin"
        )
        db.add(new_admin)
        db.commit()
        print("Admin user created: 1234567890 / admin123")
    else:
        # Reset password to ensure it matches admin123
        admin.password = get_password_hash("admin123")
        db.commit()
        print("Admin user password reset to: admin123")
    db.close()

if __name__ == "__main__":
    create_admin()
