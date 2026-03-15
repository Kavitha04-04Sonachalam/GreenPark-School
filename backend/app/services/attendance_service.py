from sqlalchemy.orm import Session
from ..models.attendance import Attendance

def get_attendance_for_student(db: Session, student_id: str):
    attendance = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    result = []
    for a in attendance:
        result.append({
            "id": f"{a.student_id}_{a.date.isoformat()}",
            "date": a.date.isoformat(),
            "subject": "All Subjects", # Or "General"
            "status": a.status,
            "remarks": a.remarks,
            "academic_year": a.academic_year
        })
    return result
