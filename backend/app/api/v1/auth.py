from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...schemas.auth_schema import LoginRequest, Token, ResetPasswordRequest, ChangePasswordRequest, ForgotPasswordRequest, PasswordResetRequestResponse, ResetParentPasswordRequest
from ...services import auth_service
from typing import List

router = APIRouter()

@router.post("/login")
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login(db, login_data)

@router.post("/admin/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    # In a real app, you would verify if the caller is an admin
    return auth_service.reset_password(db, request.phone_number, request.new_password)

@router.post("/change-password")
def change_password(request: ChangePasswordRequest, db: Session = Depends(get_db)):
    return auth_service.change_password(db, request.phone_number, request.current_password, request.new_password)

@router.post("/auth/forgot-password-request")
def request_password_reset(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return auth_service.create_password_reset_request(db, request.phone_number)

@router.get("/admin/password-reset-requests", response_model=List[PasswordResetRequestResponse])
def get_reset_requests(db: Session = Depends(get_db)):
    return auth_service.get_pending_password_reset_requests(db)

@router.post("/admin/reset-parent-password")
def reset_parent_password(request: ResetParentPasswordRequest, db: Session = Depends(get_db)):
    return auth_service.reset_parent_password(db, request.phone_number)
