from sqlalchemy import text
from app.core.database import SessionLocal

def fix_students_pk():
    db = SessionLocal()
    try:
        print("Adding PRIMARY KEY to students.student_id...")
        db.execute(text("ALTER TABLE students ADD PRIMARY KEY (student_id);"))
        db.commit()
        print("PK added successfully.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.path.join(os.getcwd(), "backend"))
    fix_students_pk()
