from sqlalchemy.orm import Session, joinedload
from ..models.user import User
from ..models.parent import Parent
from ..models.student import Student
from ..models.staff import Staff
from ..models.admin import Admin
from ..models.password_reset_request import PasswordResetRequest
from ..core.security import verify_password, create_access_token, get_password_hash
from ..schemas.auth_schema import LoginRequest, Token, UserResponse, PasswordResetRequestResponse
from fastapi import HTTPException, status

def authenticate_user(db: Session, login_data: LoginRequest):
    user = db.query(User).filter(User.phone_number == login_data.phone_number, User.role == login_data.role).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid phone number or password")
    
    if not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid phone number or password")
    
    return user

def login(db: Session, login_data: LoginRequest):
    # Retrieve user with joinedload based on the role to reduce DB lookups to 1 query
    query = db.query(User).filter(User.phone_number == login_data.phone_number, User.role == login_data.role)
    if login_data.role == "parent":
        query = query.options(joinedload(User.parent))
    elif login_data.role == "student":
        query = query.options(joinedload(User.student))
    elif login_data.role == "staff":
        query = query.options(joinedload(User.staff))
    elif login_data.role == "admin":
        query = query.options(joinedload(User.admin))
    
    user = query.first()
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid phone number or password")
    
    parent_data = None
    children_list = []
    student_data = None
    class_name = None
    admission_number = None
    staff_data = None
    department = None
    admin_data = None
    
    name = "User"
    email = None
    profile_image_url = None
    
    if user.role == "parent":
        parent = user.parent
        if parent:
            parent_data = parent
            name = parent.father_name or parent.guardian_name or "Parent"
            profile_image_url = parent.profile_image_url
            # Children list is omitted at login time for performance. It will be loaded asynchronously.
            children_list = []
    elif user.role == "student":
        student = user.student
        if student:
            student_data = student
            name = f"{student.first_name} {student.last_name}"
            class_name = f"{student.class_} {student.section}"
            admission_number = student.admission_number
    elif user.role == "staff":
        staff = user.staff
        if staff:
            staff_data = staff
            name = f"{staff.first_name} {staff.last_name}"
            email = staff.email
            profile_image_url = staff.profile_image_url
            department = staff.department
    elif user.role == "admin":
        admin = user.admin
        if admin:
            admin_data = admin
            name = f"{admin.first_name} {admin.last_name}"
            email = admin.email
            profile_image_url = admin.profile_image_url
        if name == "User":
            name = "Administrator"
            
    user_response = UserResponse(
        id=str(user.user_id),
        parent_id=user.parent_id,
        student_id=user.student_id,
        staff_id=user.staff_id,
        admin_id=user.admin_id,
        phone_number=user.phone_number,
        email=email,
        name=name,
        role=user.role,
        profile_image_url=profile_image_url,
        children=children_list,
        department=department,
        class_name=class_name,
        admission_number=admission_number
    )
    
    access_token = create_access_token(data={"sub": str(user.user_id), "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }


def reset_password(db: Session, phone_number: str, new_password: str):
    user = db.query(User).filter(User.phone_number == phone_number).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this phone number not found")
    
    user.password = get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    return {"message": "Password reset successfully"}

def change_password(db: Session, phone_number: str, current_password: str, new_password: str):
    user = db.query(User).filter(User.phone_number == phone_number).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(current_password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    user.password = get_password_hash(new_password)
    db.commit()
    return {"message": "Password changed successfully"}

def create_password_reset_request(db: Session, phone_number: str):
    user = db.query(User).filter(User.phone_number == phone_number, User.role == "parent").first()
    if not user:
        raise HTTPException(status_code=404, detail="Parent with this phone number not found")
    
    # Check if a pending request already exists
    existing_request = db.query(PasswordResetRequest).filter(
        PasswordResetRequest.phone_number == phone_number,
        PasswordResetRequest.status == "pending"
    ).first()
    
    if existing_request:
        return {"message": "Password reset request already sent to admin."}

    new_request = PasswordResetRequest(
        phone_number=phone_number,
        parent_id=user.parent_id,
        status="pending"
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return {"message": "Password reset request sent to admin."}

def get_pending_password_reset_requests(db: Session):
    results = db.query(PasswordResetRequest, Parent.father_name).outerjoin(
        Parent, PasswordResetRequest.parent_id == Parent.parent_id
    ).filter(PasswordResetRequest.status == "pending").all()
    
    result = []
    for req, father_name in results:
        result.append(PasswordResetRequestResponse(
            id=req.id,
            phone_number=req.phone_number,
            parent_id=req.parent_id,
            parent_name=father_name or "Unknown",
            request_time=req.request_time.isoformat(),
            status=req.status
        ))
    return result

def reset_parent_password(db: Session, phone_number: str):
    user = db.query(User).filter(User.phone_number == phone_number).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password to default: password123
    user.password = get_password_hash("password123")
    
    # Resolve all pending requests for this phone number
    requests = db.query(PasswordResetRequest).filter(
        PasswordResetRequest.phone_number == phone_number,
        PasswordResetRequest.status == "pending"
    ).all()
    
    for req in requests:
        req.status = "resolved"
    
    db.commit()
    return {"message": "Password reset successfully."}

