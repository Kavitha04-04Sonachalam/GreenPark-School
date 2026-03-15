from sqlalchemy.orm import Session
from ..models.fees import Fees

def get_fees_for_student(db: Session, student_id: str):
    fees = db.query(Fees).filter(Fees.student_id == student_id).all()
    result = []
    for f in fees:
        result.append({
            "id": str(f.fee_id),
            "type": f.fee_type,
            "amount": f.amount,
            "dueDate": f.due_date.isoformat() if f.due_date else "",
            "status": f.status,
            "month": f.month,
            "year": f.year
        })
    return result
