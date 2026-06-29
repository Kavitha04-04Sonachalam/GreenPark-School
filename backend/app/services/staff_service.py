from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from ..models.staff import Staff
from ..models.user import User
from ..core.security import get_password_hash
from ..schemas.staff_schema import StaffCreate, StaffUpdate
from fastapi import HTTPException, status
from typing import Optional

def create_staff(db: Session, staff_data: StaffCreate) -> Staff:
    # 1. Reject duplicate employee_id or mobile_no
    existing_emp = db.query(Staff).filter(Staff.employee_id == staff_data.employee_id).first()
    if existing_emp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee ID already exists"
        )
        
    existing_mobile = db.query(Staff).filter(Staff.mobile_no == staff_data.mobile_no).first()
    if existing_mobile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number already exists"
        )
        
    # Check if duplicate login phone number exists for staff role
    existing_user = db.query(User).filter(User.phone_number == staff_data.mobile_no, User.role == "staff").first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A staff login with this mobile number already exists"
        )

    try:
        # 2. Create User account first
        new_user = User(
            phone_number=staff_data.mobile_no,
            password=get_password_hash(staff_data.password),
            role="staff",
            staff_id=staff_data.employee_id
        )
        db.add(new_user)
        db.flush() # Flush to populate user_id
        
        # 3. Create Staff record
        new_staff = Staff(
            employee_id=staff_data.employee_id,
            employee_name=staff_data.employee_name,
            gender=staff_data.gender,
            mobile_no=staff_data.mobile_no,
            designation=staff_data.designation,
            date_of_joining=staff_data.date_of_joining,
            door_no=staff_data.door_no,
            street_name=staff_data.street_name,
            state=staff_data.state,
            district=staff_data.district,
            pincode=staff_data.pincode,
            access_rights=staff_data.access_rights,
            is_active=staff_data.is_active if staff_data.is_active is not None else True,
            user_id=new_user.user_id,
            
            # Compatibility fields
            staff_id=staff_data.employee_id,
            first_name=staff_data.employee_name.split(" ")[0] if " " in staff_data.employee_name else staff_data.employee_name,
            last_name=staff_data.employee_name.split(" ", 1)[1] if " " in staff_data.employee_name else "",
            email=f"{staff_data.employee_id.lower()}@greenparkschool.com",
            phone=staff_data.mobile_no,
            department=staff_data.designation
        )
        db.add(new_staff)
        db.commit()
        db.refresh(new_staff)
        return new_staff
        
    except Exception as e:
        db.rollback()
        raise e

def update_staff(db: Session, id: int, staff_data: StaffUpdate) -> Staff:
    db_staff = db.query(Staff).filter(Staff.id == id).first()
    if not db_staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )
        
    # Check duplicate mobile_no if it is changing
    if staff_data.mobile_no and staff_data.mobile_no != db_staff.mobile_no:
        existing_mobile = db.query(Staff).filter(Staff.mobile_no == staff_data.mobile_no).first()
        if existing_mobile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mobile number already exists"
            )
            
        existing_user = db.query(User).filter(
            User.phone_number == staff_data.mobile_no,
            User.role == "staff",
            User.user_id != db_staff.user_id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A staff login with this mobile number already exists"
            )

    try:
        # Update fields dynamically
        for key, val in staff_data.model_dump(exclude_unset=True).items():
            if key == "password":
                continue
            setattr(db_staff, key, val)
            
        # Update compatibility fields
        if staff_data.employee_name:
            db_staff.first_name = staff_data.employee_name.split(" ")[0] if " " in staff_data.employee_name else staff_data.employee_name
            db_staff.last_name = staff_data.employee_name.split(" ", 1)[1] if " " in staff_data.employee_name else ""
        if staff_data.mobile_no:
            db_staff.phone = staff_data.mobile_no
        if staff_data.designation:
            db_staff.department = staff_data.designation

        # Update linked User details if applicable
        if db_staff.user_id:
            user = db.query(User).filter(User.user_id == db_staff.user_id).first()
            if user:
                if staff_data.mobile_no:
                    user.phone_number = staff_data.mobile_no
                if staff_data.password:
                    user.password = get_password_hash(staff_data.password)

        db.commit()
        db.refresh(db_staff)
        return db_staff
        
    except Exception as e:
        db.rollback()
        raise e

def delete_staff(db: Session, id: int) -> bool:
    db_staff = db.query(Staff).filter(Staff.id == id).first()
    if not db_staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )
        
    try:
        # If user account is linked, delete it (cascade onDelete will also handle, but manual cleanup is safer)
        if db_staff.user_id:
            user = db.query(User).filter(User.user_id == db_staff.user_id).first()
            if user:
                db.delete(user)
                
        db.delete(db_staff)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise e

def get_staff_by_id(db: Session, id: int) -> Staff:
    db_staff = db.query(Staff).filter(Staff.id == id).first()
    if not db_staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )
    return db_staff

def get_staff(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    gender: Optional[str] = None, 
    designation: Optional[str] = None, 
    access_rights: Optional[str] = None, 
    is_active: Optional[bool] = None, 
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_dir: Optional[str] = "asc"
):
    query = db.query(Staff)
    
    # 1. Filters
    if gender:
        query = query.filter(Staff.gender == gender)
    if designation:
        query = query.filter(Staff.designation == designation)
    if access_rights:
        query = query.filter(Staff.access_rights == access_rights)
    if is_active is not None:
        query = query.filter(Staff.is_active == is_active)
        
    # 2. Search
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Staff.employee_id.ilike(search_pattern),
                Staff.employee_name.ilike(search_pattern),
                Staff.mobile_no.ilike(search_pattern)
            )
        )
        
    # 3. Sorting
    if sort_by:
        col = getattr(Staff, sort_by, None)
        if col:
            if sort_dir == "desc":
                query = query.order_by(desc(col))
            else:
                query = query.order_by(asc(col))
    else:
        query = query.order_by(asc(Staff.employee_id))
        
    return query.offset(skip).limit(limit).all()
