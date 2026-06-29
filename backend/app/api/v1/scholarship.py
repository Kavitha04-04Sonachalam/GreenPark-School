from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from ...core.database import get_db
from ...models.scholarship import Scholarship
from ...models.scholarship_posting import ScholarshipPosting
from ...models.student import Student
from ...models.academic_year import AcademicYear
from ...models.student_enrollment import StudentEnrollment
from ...schemas import scholarship_schema
from ...api.deps import get_current_admin_user

router = APIRouter()

@router.get("/scholarships", response_model=List[scholarship_schema.ScholarshipSchema])
def get_scholarships(
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    return db.query(Scholarship).order_by(Scholarship.id.asc()).all()

@router.post("/scholarships", response_model=scholarship_schema.ScholarshipSchema)
def create_scholarship(
    req: scholarship_schema.ScholarshipCreate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    existing = db.query(Scholarship).filter(
        func.lower(Scholarship.name) == req.name.strip().lower()
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Scholarship already exists")
    
    scholarship = Scholarship(name=req.name.strip())
    db.add(scholarship)
    db.commit()
    db.refresh(scholarship)
    return scholarship

@router.get("/scholarship-postings", response_model=List[scholarship_schema.ScholarshipPostingSchema])
def get_scholarship_postings(
    academic_year_id: Optional[int] = None,
    school_class: Optional[str] = None,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    query = db.query(
        ScholarshipPosting.id,
        ScholarshipPosting.student_id,
        ScholarshipPosting.scholarship_id,
        ScholarshipPosting.academic_year_id,
        ScholarshipPosting.amount,
        (Student.first_name + " " + Student.last_name).label("student_name"),
        func.coalesce(StudentEnrollment.school_class, Student.class_).label("school_class"),
        func.coalesce(StudentEnrollment.roll_number, Student.roll_number).label("roll_no"),
        Scholarship.name.label("scholarship_name"),
        AcademicYear.year_name.label("year_name")
    ).join(Student, ScholarshipPosting.student_id == Student.student_id)\
     .join(Scholarship, ScholarshipPosting.scholarship_id == Scholarship.id)\
     .join(AcademicYear, ScholarshipPosting.academic_year_id == AcademicYear.year_id)\
     .outerjoin(
         StudentEnrollment,
         and_(
             StudentEnrollment.student_id == Student.student_id,
             StudentEnrollment.academic_year_id == ScholarshipPosting.academic_year_id
         )
     )
     
    if academic_year_id is not None:
        query = query.filter(ScholarshipPosting.academic_year_id == academic_year_id)
    if school_class:
        query = query.filter(func.coalesce(StudentEnrollment.school_class, Student.class_) == school_class)
        
    results = query.order_by(ScholarshipPosting.id.desc()).all()
    
    formatted = []
    for r in results:
        formatted.append(scholarship_schema.ScholarshipPostingSchema(
            id=r.id,
            student_id=r.student_id,
            scholarship_id=r.scholarship_id,
            academic_year_id=r.academic_year_id,
            amount=float(r.amount),
            student_name=r.student_name,
            school_class=r.school_class,
            roll_no=r.roll_no,
            scholarship_name=r.scholarship_name,
            year_name=r.year_name
        ))
    return formatted

@router.post("/scholarship-postings", response_model=scholarship_schema.ScholarshipPostingSchema)
def create_scholarship_posting(
    req: scholarship_schema.ScholarshipPostingCreate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        
    student = db.query(Student).filter(Student.student_id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    scholarship = db.query(Scholarship).filter(Scholarship.id == req.scholarship_id).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")
        
    ay = db.query(AcademicYear).filter(AcademicYear.year_id == req.academic_year_id).first()
    if not ay:
        raise HTTPException(status_code=404, detail="Academic Year not found")
        
    posting = ScholarshipPosting(
        academic_year_id=req.academic_year_id,
        student_id=req.student_id,
        scholarship_id=req.scholarship_id,
        amount=req.amount
    )
    db.add(posting)
    db.commit()
    db.refresh(posting)
    
    # Query joined details for response
    joined = db.query(
        ScholarshipPosting.id,
        ScholarshipPosting.student_id,
        ScholarshipPosting.scholarship_id,
        ScholarshipPosting.academic_year_id,
        ScholarshipPosting.amount,
        (Student.first_name + " " + Student.last_name).label("student_name"),
        func.coalesce(StudentEnrollment.school_class, Student.class_).label("school_class"),
        func.coalesce(StudentEnrollment.roll_number, Student.roll_number).label("roll_no"),
        Scholarship.name.label("scholarship_name"),
        AcademicYear.year_name.label("year_name")
    ).join(Student, ScholarshipPosting.student_id == Student.student_id)\
     .join(Scholarship, ScholarshipPosting.scholarship_id == Scholarship.id)\
     .join(AcademicYear, ScholarshipPosting.academic_year_id == AcademicYear.year_id)\
     .outerjoin(
         StudentEnrollment,
         and_(
             StudentEnrollment.student_id == Student.student_id,
             StudentEnrollment.academic_year_id == ScholarshipPosting.academic_year_id
         )
     )\
     .filter(ScholarshipPosting.id == posting.id).first()
     
    return scholarship_schema.ScholarshipPostingSchema(
        id=joined.id,
        student_id=joined.student_id,
        scholarship_id=joined.scholarship_id,
        academic_year_id=joined.academic_year_id,
        amount=float(joined.amount),
        student_name=joined.student_name,
        school_class=joined.school_class,
        roll_no=joined.roll_no,
        scholarship_name=joined.scholarship_name,
        year_name=joined.year_name
    )
