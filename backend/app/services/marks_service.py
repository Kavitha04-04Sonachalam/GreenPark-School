from sqlalchemy.orm import Session
from ..models.marks import Marks

def get_marks_for_student(db: Session, student_id: str):
    marks = db.query(Marks).filter(Marks.student_id == student_id).all()
    marks_list = []
    for m in marks:
        percentage = (m.marks_obtained / m.total_marks) * 100 if m.total_marks > 0 else 0
        marks_list.append({
            "id": m.mark_id,
            "subject": m.subject,
            "marks_obtained": m.marks_obtained,
            "total_marks": m.total_marks,
            "percentage": round(percentage, 2)
        })
    return {
        "student_id": student_id,
        "marks": marks_list
    }
