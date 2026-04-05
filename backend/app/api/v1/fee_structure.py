from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...models.fee_structure import FeeStructure
from ...models.fee_component import FeeComponent
from ...schemas import fee_structure_schema

router = APIRouter()

@router.post("/", response_model=fee_structure_schema.FeeStructureSchema)
def create_fee_structure(req: fee_structure_schema.CreateFeeStructureRequest, db: Session = Depends(get_db)):
    existing = db.query(FeeStructure).filter_by(class_name=req.class_name, academic_year=req.academic_year).first()
    if existing:
        raise HTTPException(status_code=400, detail="Fee structure for this class and academic year already exists")
    
    new_structure = FeeStructure(
        class_name=req.class_name,
        academic_year=req.academic_year
    )
    db.add(new_structure)
    db.commit()
    db.refresh(new_structure)
    
    for comp in req.components:
        new_comp = FeeComponent(
            structure_id=new_structure.id,
            component_name=comp.component_name,
            amount=comp.amount
        )
        db.add(new_comp)
    db.commit()
    db.refresh(new_structure)
    return new_structure

@router.put("/{id}", response_model=fee_structure_schema.FeeStructureSchema)
def update_fee_structure(id: int, req: fee_structure_schema.UpdateFeeStructureRequest, db: Session = Depends(get_db)):
    structure = db.query(FeeStructure).filter_by(id=id).first()
    if not structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")
        
    if req.class_name:
        structure.class_name = req.class_name
    if req.academic_year:
        structure.academic_year = req.academic_year
        
    db.query(FeeComponent).filter_by(structure_id=id).delete()
    
    for comp in req.components:
        new_comp = FeeComponent(
            structure_id=structure.id,
            component_name=comp.component_name,
            amount=comp.amount
        )
        db.add(new_comp)
        
    db.commit()
    db.refresh(structure)
    return structure

@router.get("/", response_model=List[fee_structure_schema.FeeStructureSchema])
def get_all_fee_structures(db: Session = Depends(get_db)):
    return db.query(FeeStructure).all()

@router.get("/{class_name}", response_model=fee_structure_schema.FeeStructureSchema)
def get_fee_structure_by_class(class_name: str, db: Session = Depends(get_db)):
    structure = db.query(FeeStructure).filter_by(class_name=class_name).order_by(FeeStructure.created_at.desc()).first()
    if not structure:
        raise HTTPException(status_code=404, detail="Fee structure not found for this class")
    return structure

@router.delete("/{id}")
def delete_fee_structure(id: int, db: Session = Depends(get_db)):
    structure = db.query(FeeStructure).filter_by(id=id).first()
    if not structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")
    db.delete(structure)
    db.commit()
    return {"message": "Deleted successfully"}
