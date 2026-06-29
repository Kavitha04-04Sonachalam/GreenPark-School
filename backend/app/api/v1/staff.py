from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ..deps import get_current_admin_user
from ...schemas import staff_schema
from ...services import staff_service
from typing import List, Optional
from datetime import date

router = APIRouter()

@router.post("/staff", response_model=staff_schema.StaffResponse, status_code=status.HTTP_201_CREATED)
def create_staff_endpoint(
    staff_data: staff_schema.StaffCreate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    return staff_service.create_staff(db, staff_data)

@router.get("/staff", response_model=List[staff_schema.StaffResponse])
def get_staff_endpoint(
    skip: int = 0,
    limit: int = 100,
    gender: Optional[str] = None,
    designation: Optional[str] = None,
    access_rights: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_dir: Optional[str] = "asc",
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    return staff_service.get_staff(
        db=db,
        skip=skip,
        limit=limit,
        gender=gender,
        designation=designation,
        access_rights=access_rights,
        is_active=is_active,
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir
    )

@router.get("/staff/{id}", response_model=staff_schema.StaffResponse)
def get_staff_by_id_endpoint(
    id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    return staff_service.get_staff_by_id(db, id)

@router.put("/staff/{id}", response_model=staff_schema.StaffResponse)
def update_staff_endpoint(
    id: int,
    staff_data: staff_schema.StaffUpdate,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    return staff_service.update_staff(db, id, staff_data)

@router.delete("/staff/{id}")
def delete_staff_endpoint(
    id: int,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin_user)
):
    staff_service.delete_staff(db, id)
    return {"success": True, "message": "Staff member and linked user account deleted successfully."}
