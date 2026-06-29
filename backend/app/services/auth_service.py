from sqlalchemy.orm import Session
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
    user = authenticate_user(db, login_data)
    
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
    
    if user.role == "parent" and user.parent_id:
        parent = db.query(Parent).filter(Parent.parent_id == user.parent_id).first()
        if parent:
            parent_data = parent
            name = parent.father_name or parent.guardian_name or "Parent"
            profile_image_url = parent.profile_image_url
            children = db.query(Student).filter(Student.parent_id == parent.parent_id).all()
            for child in children:
                children_list.append({
                    "id": str(child.student_id),
                    "name": f"{child.first_name} {child.last_name}",
                    "class": f"{child.class_} {child.section}",
                    "rollNo": child.roll_number
                })
    elif user.role == "student" and user.student_id:
        student = db.query(Student).filter(Student.student_id == user.student_id).first()
        if student:
            student_data = student
            name = f"{student.first_name} {student.last_name}"
            class_name = f"{student.class_} {student.section}"
            admission_number = student.admission_number
    elif user.role == "staff" and user.staff_id:
        staff = db.query(Staff).filter(Staff.staff_id == user.staff_id).first()
        if staff:
            staff_data = staff
            name = f"{staff.first_name} {staff.last_name}"
            email = staff.email
            profile_image_url = staff.profile_image_url
            department = staff.department
    elif user.role == "admin":
        if user.admin_id:
            admin = db.query(Admin).filter(Admin.admin_id == user.admin_id).first()
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
    requests = db.query(PasswordResetRequest).filter(PasswordResetRequest.status == "pending").all()
    result = []
    for req in requests:
        parent = db.query(Parent).filter(Parent.parent_id == req.parent_id).first()
        result.append(PasswordResetRequestResponse(
            id=req.id,
            phone_number=req.phone_number,
            parent_id=req.parent_id,
            parent_name=parent.father_name if parent else "Unknown",
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

