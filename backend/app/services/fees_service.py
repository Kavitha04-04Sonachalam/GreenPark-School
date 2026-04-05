from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.fee_component import FeeComponent
from ..models.fee_component import FeeComponent
from ..models.fees import Fees  # For fallback

def get_fees_for_student(db: Session, student_id: str):
    # Fetch all fee components for student
    components = db.query(FeeComponent).filter(FeeComponent.student_id == student_id).all()
    
    total_fee = 0.0
    fee_components_list = []
    
    if components:
        for c in components:
            amt = float(c.amount or 0.0)
            total_fee += amt
            fee_components_list.append({
                "fee_type": c.fee_type,
                "amount": amt
            })
    else:
        # Fallback to legacy Fees table if no components set
        legacy_fees = db.query(Fees).filter(Fees.student_id == student_id).all()
        if legacy_fees:
            for f in legacy_fees:
                amt = float(f.amount or 0.0)
                total_fee += amt
                fee_components_list.append({
                    "fee_type": f.fee_type or "Legacy Fee",
                    "amount": amt
                })
        
    return {
        "total_fee": total_fee,
        "fee_components": fee_components_list
    }
