from app.core.database import SessionLocal
from app.models import Student, Parent, ClassModel, Activity

def check_counts():
    db = SessionLocal()
    print(f"Total Students: {db.query(Student).count()}")
    print(f"Total Parents: {db.query(Parent).count()}")
    print(f"Total Classes: {db.query(ClassModel).count()}")
    print(f"Total Activities: {db.query(Activity).count()}")
    db.close()

if __name__ == "__main__":
    check_counts()
