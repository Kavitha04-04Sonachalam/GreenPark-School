from app.core.database import engine
from app.models.marks import Marks
from app.models.base import Base

def reset_marks_table():
    print("Dropping marks table...")
    Marks.__table__.drop(engine, checkfirst=True)
    print("Creating marks table...")
    Marks.__table__.create(engine)
    print("Marks table reset successfully.")

if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.path.join(os.getcwd(), "backend"))
    reset_marks_table()
