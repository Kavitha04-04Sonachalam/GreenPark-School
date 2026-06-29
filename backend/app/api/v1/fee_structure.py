from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ...core.database import get_db
from ...models.fee_structure import FeeStructure
from ...models.academic_year import AcademicYear
from ...models.term import Term
from ...models.fee_category import FeeCategory
from ...models.fee_payment import FeePayment
from ...schemas import fee_structure_schema
from ...api.deps import get_current_admin_user

router = APIRouter()

@router.get("/fee-structures", response_model=List[fee_structure_schema.FeeStructureSchema])
def get_fee_structures(
    academic_year_id: Optional[int] = None,
    school_class: Optional[str] = None,
    term_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    query = db.query(
        FeeStructure.id,
        FeeStructure.academic_year_id,
        FeeStructure.school_class,
        FeeStructure.term_id,
        FeeStructure.category_id,
        FeeStructure.amount,
        AcademicYear.year_name.label("year_name"),
        Term.term_name.label("term_name"),
        FeeCategory.category_name.label("category_name")
    ).join(AcademicYear, FeeStructure.academic_year_id == AcademicYear.year_id)\
     .join(Term, FeeStructure.term_id == Term.term_id)\
     .join(FeeCategory, FeeStructure.category_id == FeeCategory.category_id)
    
    if academic_year_id is not None:
        query = query.filter(FeeStructure.academic_year_id == academic_year_id)
    if school_class:
        query = query.filter(FeeStructure.school_class == school_class)
    if term_id is not None:
        query = query.filter(FeeStructure.term_id == term_id)
        
    results = query.order_by(FeeStructure.id.asc()).all()
    
    formatted = []
    for r in results:
        formatted.append(fee_structure_schema.FeeStructureSchema(
            id=r.id,
            academic_year_id=r.academic_year_id,
            school_class=r.school_class,
            term_id=r.term_id,
            category_id=r.category_id,
            amount=float(r.amount),
            year_name=r.year_name,
            term_name=r.term_name,
            category_name=r.category_name
        ))
    return formatted

@router.post("/fee-structures", response_model=fee_structure_schema.FeeStructureSchema)
def create_fee_structure(
    req: fee_structure_schema.FeeStructureCreate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        
    # Check duplicate combination
    existing = db.query(FeeStructure).filter_by(
        academic_year_id=req.academic_year_id,
        school_class=req.school_class,
        term_id=req.term_id,
        category_id=req.category_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Fee structure already exists for this year/class/term/category combination."
        )
        
    struct = FeeStructure(
        academic_year_id=req.academic_year_id,
        school_class=req.school_class,
        term_id=req.term_id,
        category_id=req.category_id,
        amount=req.amount
    )
    db.add(struct)
    db.commit()
    db.refresh(struct)
    
    # Query joined details for response
    joined = db.query(
        FeeStructure.id,
        FeeStructure.academic_year_id,
        FeeStructure.school_class,
        FeeStructure.term_id,
        FeeStructure.category_id,
        FeeStructure.amount,
        AcademicYear.year_name.label("year_name"),
        Term.term_name.label("term_name"),
        FeeCategory.category_name.label("category_name")
    ).join(AcademicYear, FeeStructure.academic_year_id == AcademicYear.year_id)\
     .join(Term, FeeStructure.term_id == Term.term_id)\
     .join(FeeCategory, FeeStructure.category_id == FeeCategory.category_id)\
     .filter(FeeStructure.id == struct.id).first()
     
    return fee_structure_schema.FeeStructureSchema(
        id=joined.id,
        academic_year_id=joined.academic_year_id,
        school_class=joined.school_class,
        term_id=joined.term_id,
        category_id=joined.category_id,
        amount=float(joined.amount),
        year_name=joined.year_name,
        term_name=joined.term_name,
        category_name=joined.category_name
    )

@router.put("/fee-structures/{struct_id}", response_model=fee_structure_schema.FeeStructureSchema)
def update_fee_structure(
    struct_id: int,
    req: fee_structure_schema.FeeStructureCreate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        
    struct = db.query(FeeStructure).filter(FeeStructure.id == struct_id).first()
    if not struct:
        raise HTTPException(status_code=404, detail="Fee structure not found")
        
    # Check duplicate combination excluding this ID
    existing = db.query(FeeStructure).filter(
        FeeStructure.academic_year_id == req.academic_year_id,
        FeeStructure.school_class == req.school_class,
        FeeStructure.term_id == req.term_id,
        FeeStructure.category_id == req.category_id,
        FeeStructure.id != struct_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Fee structure already exists for this year/class/term/category combination."
        )
        
    struct.academic_year_id = req.academic_year_id
    struct.school_class = req.school_class
    struct.term_id = req.term_id
    struct.category_id = req.category_id
    struct.amount = req.amount
    db.commit()
    db.refresh(struct)
    
    # Query joined details for response
    joined = db.query(
        FeeStructure.id,
        FeeStructure.academic_year_id,
        FeeStructure.school_class,
        FeeStructure.term_id,
        FeeStructure.category_id,
        FeeStructure.amount,
        AcademicYear.year_name.label("year_name"),
        Term.term_name.label("term_name"),
        FeeCategory.category_name.label("category_name")
    ).join(AcademicYear, FeeStructure.academic_year_id == AcademicYear.year_id)\
     .join(Term, FeeStructure.term_id == Term.term_id)\
     .join(FeeCategory, FeeStructure.category_id == FeeCategory.category_id)\
     .filter(FeeStructure.id == struct.id).first()
     
    return fee_structure_schema.FeeStructureSchema(
        id=joined.id,
        academic_year_id=joined.academic_year_id,
        school_class=joined.school_class,
        term_id=joined.term_id,
        category_id=joined.category_id,
        amount=float(joined.amount),
        year_name=joined.year_name,
        term_name=joined.term_name,
        category_name=joined.category_name
    )

@router.delete("/fee-structures/{struct_id}")
def delete_fee_structure(
    struct_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    struct = db.query(FeeStructure).filter(FeeStructure.id == struct_id).first()
    if not struct:
        raise HTTPException(status_code=404, detail="Fee structure not found")
        
    # Guard: check if referenced by any FeePayment
    has_payments = db.query(FeePayment).filter(FeePayment.fee_structure_id == struct_id).first()
    if has_payments:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete — payments exist against this structure."
        )
        
    db.delete(struct)
    db.commit()
    return {"success": True}

@router.post("/fee-structures/duplicate")
def duplicate_fee_structure(
    req: fee_structure_schema.DuplicateFeeStructureRequest,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    source_structures = db.query(FeeStructure).filter(FeeStructure.academic_year_id == req.source_academic_year_id).all()
    if not source_structures:
        raise HTTPException(status_code=404, detail="No fee structures found in the source academic year")
        
    duplicated_count = 0
    for src in source_structures:
        # Check target structure existence
        exists = db.query(FeeStructure).filter_by(
            academic_year_id=req.target_academic_year_id,
            school_class=src.school_class,
            term_id=src.term_id,
            category_id=src.category_id
        ).first()
        if exists:
            continue
            
        dest_struct = FeeStructure(
            academic_year_id=req.target_academic_year_id,
            school_class=src.school_class,
            term_id=src.term_id,
            category_id=src.category_id,
            amount=src.amount
        )
        db.add(dest_struct)
        duplicated_count += 1
        
    db.commit()
    return {"success": True, "count": duplicated_count}
