from sqlalchemy.orm import Session
from ..models.marks import Marks

from typing import Optional

def get_marks_for_student(db: Session, student_id: str, exam_type: Optional[str] = None):
    query = db.query(Marks).filter(Marks.student_id == student_id)
    
    selected_exam = exam_type
    
    if exam_type == "Recent" or not exam_type:
        # Find the most recent exam type based on date
        latest_record = db.query(Marks).filter(Marks.student_id == student_id).order_by(Marks.exam_date.desc()).first()
        if latest_record:
            selected_exam = latest_record.exam_type
            query = query.filter(Marks.exam_type == selected_exam)
        else:
            return {"student_id": student_id, "marks": [], "exam_type": "None"}
    else:
        query = query.filter(Marks.exam_type == exam_type)

    marks = query.all()
    marks_list = []
    
    for m in marks:
        percentage = (m.marks_obtained / m.total_marks) * 100 if m.total_marks > 0 else 0
        
        # Calculate Grade
        grade = "F"
        if percentage >= 90: grade = "A+"
        elif percentage >= 80: grade = "A"
        elif percentage >= 70: grade = "B"
        elif percentage >= 60: grade = "C"
        elif percentage >= 50: grade = "D"
        elif percentage >= 35: grade = "E"

        marks_list.append({
            "id": m.mark_id,
            "subject": m.subject,
            "marks_obtained": m.marks_obtained,
            "total_marks": m.total_marks,
            "percentage": round(percentage, 2),
            "grade": grade,
            "exam_type": m.exam_type,
            "date": m.exam_date.isoformat() if m.exam_date else None
        })
        
    return {
        "student_id": student_id,
        "exam_type": selected_exam or "None",
        "marks": marks_list
    }
