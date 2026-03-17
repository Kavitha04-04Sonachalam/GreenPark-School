from app.core.database import engine
from app.models.attendance import Attendance
from app.models.base import Base

def reset_attendance_table():
    print("Dropping attendance table...")
    Attendance.__table__.drop(engine, checkfirst=True)
    print("Creating attendance table...")
    Attendance.__table__.create(engine)
    print("Attendance table reset successfully.")

if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.path.join(os.getcwd(), "backend"))
    reset_attendance_table()
