from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ...core.database import get_db
from ...models.fee_category import FeeCategory
from ...models.fee_structure import FeeStructure
from ...schemas import fee_category_schema
from ...api.deps import get_current_admin_user

router = APIRouter()

@router.get("/fee-categories", response_model=List[fee_category_schema.FeeCategorySchema])
def get_fee_categories(
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    return db.query(FeeCategory).order_by(FeeCategory.category_id.asc()).all()

@router.post("/fee-categories", response_model=fee_category_schema.FeeCategorySchema)
def create_fee_category(
    req: fee_category_schema.FeeCategoryCreate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    # Case-insensitive duplicate check
    existing = db.query(FeeCategory).filter(
        func.lower(FeeCategory.category_name) == req.category_name.strip().lower()
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Fee Category already exists")
    
    cat = FeeCategory(category_name=req.category_name.strip())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.put("/fee-categories/{cat_id}", response_model=fee_category_schema.FeeCategorySchema)
def update_fee_category(
    cat_id: int,
    req: fee_category_schema.FeeCategoryCreate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    cat = db.query(FeeCategory).filter(FeeCategory.category_id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Fee Category not found")
    
    # Case-insensitive duplicate check
    existing = db.query(FeeCategory).filter(
        func.lower(FeeCategory.category_name) == req.category_name.strip().lower(),
        FeeCategory.category_id != cat_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Fee Category name already exists")
    
    cat.category_name = req.category_name.strip()
    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/fee-categories/{cat_id}")
def delete_fee_category(
    cat_id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    cat = db.query(FeeCategory).filter(FeeCategory.category_id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Fee Category not found")
    
    # Guard: referenced by FeeStructure?
    struct_exists = db.query(FeeStructure).filter(FeeStructure.category_id == cat_id).first()
    if struct_exists:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete — category is used in fee structures."
        )
    
    db.delete(cat)
    db.commit()
    return {"deleted": True}
