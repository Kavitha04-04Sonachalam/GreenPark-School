from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...schemas.admission_enquiry_schema import AdmissionEnquiryCreate, AdmissionEnquiryResponse
from ...models.admission_enquiry import AdmissionEnquiry
from ..deps import get_current_admin_user

router = APIRouter()

@router.post("/admission-enquiry")
def create_admission_enquiry(enquiry: AdmissionEnquiryCreate, db: Session = Depends(get_db)):
    new_enquiry = AdmissionEnquiry(
        student_name=enquiry.student_name,
        class_applied=enquiry.class_applied,
        parent_name=enquiry.parent_name,
        phone=enquiry.phone,
        message=enquiry.message
    )
    db.add(new_enquiry)
    db.commit()
    db.refresh(new_enquiry)
    return {"message": "Enquiry submitted successfully"}

@router.get("/admin/admission-enquiries", response_model=List[AdmissionEnquiryResponse])
def get_admission_enquiries(db: Session = Depends(get_db), admin = Depends(get_current_admin_user)):
    return db.query(AdmissionEnquiry).order_by(AdmissionEnquiry.created_at.desc()).all()
