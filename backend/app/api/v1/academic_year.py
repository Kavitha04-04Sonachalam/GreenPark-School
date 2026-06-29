from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ...core.database import get_db
from ...models.academic_year import AcademicYear
from ...models.term import Term
from ...schemas import academic_year_schema
from ...api.deps import get_current_admin_user

router = APIRouter()

@router.post("/academic-years", response_model=academic_year_schema.AcademicYearSchema)
def create_academic_year(
    req: academic_year_schema.AcademicYearCreate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    if req.end_date <= req.start_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")
    
    existing = db.query(AcademicYear).filter(AcademicYear.year_name == req.year_name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Academic Year with this name already exists")
    
    ay = AcademicYear(
        year_name=req.year_name,
        start_date=req.start_date,
        end_date=req.end_date,
        status="INACTIVE"
    )
    db.add(ay)
    db.commit()
    db.refresh(ay)
    
    # Auto-clone fee structures from the latest academic year that has structures
    try:
        from ...models.fee_structure import FeeStructure
        latest_ay_with_structs = db.query(AcademicYear).join(
            FeeStructure, AcademicYear.year_id == FeeStructure.academic_year_id
        ).filter(AcademicYear.year_id != ay.year_id).order_by(AcademicYear.start_date.desc()).first()
        
        if latest_ay_with_structs:
            source_structures = db.query(FeeStructure).filter(FeeStructure.academic_year_id == latest_ay_with_structs.year_id).all()
            for src in source_structures:
                dest_struct = FeeStructure(
                    academic_year_id=ay.year_id,
                    school_class=src.school_class,
                    term_id=src.term_id,
                    category_id=src.category_id,
                    amount=src.amount
                )
                db.add(dest_struct)
            db.commit()
    except Exception as e:
        print(f"Failed to auto-clone fee structures for new academic year: {e}")
        
    return ay

@router.get("/academic-years", response_model=List[academic_year_schema.AcademicYearSchema])
def get_academic_years(
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    return db.query(AcademicYear).order_by(AcademicYear.start_date.desc()).all()

@router.put("/academic-years/{ay_id}/activate", response_model=academic_year_schema.AcademicYearSchema)
def activate_academic_year(
    ay_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    ay = db.query(AcademicYear).filter(AcademicYear.year_id == ay_id).first()
    if not ay:
        raise HTTPException(status_code=404, detail="Academic Year not found")
    
    # Single transaction update
    db.query(AcademicYear).update({AcademicYear.status: "INACTIVE"})
    ay.status = "ACTIVE"
    db.commit()
    db.refresh(ay)
    return ay

@router.get("/terms")
def get_terms(
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    terms = db.query(Term).order_by(Term.term_id.asc()).all()
    return [{"term_id": t.term_id, "term_name": t.term_name} for t in terms]
