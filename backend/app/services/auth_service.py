from sqlalchemy.orm import Session
from ..models.user import User
from ..models.parent import Parent
from ..models.student import Student
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
    
    # Get associated parent info if parent
    parent_data = None
    children_list = []
    if user.role == "parent" and user.parent_id:
        parent = db.query(Parent).filter(Parent.parent_id == user.parent_id).first()
        if parent:
            parent_data = parent
            children = db.query(Student).filter(Student.parent_id == parent.parent_id).all()
            for child in children:
                children_list.append({
                    "id": str(child.student_id),
                    "name": f"{child.first_name} {child.last_name}",
                    "class": f"{child.class_} {child.section}",
                    "rollNo": child.roll_number
                })
    
    user_response = UserResponse(
        id=str(user.user_id),
        parent_id=user.parent_id,
        phone_number=user.phone_number,
        email=None, # The schema didn't have an email column in parents
        name=parent_data.father_name if parent_data else "Admin",
        role=user.role,
        profile_image_url=parent_data.profile_image_url if parent_data else None,
        children=children_list
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

