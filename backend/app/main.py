from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1.auth import router as auth_router
from .api.v1.parents import router as parents_router
from .api.v1.attendance import router as attendance_router
from .api.v1.marks import router as marks_router
from .api.v1.fees import router as fees_router
from .api.v1.admin import router as admin_router
from .api.v1.fee_structure import router as fee_structure_router
from .api.v1.gallery import router as gallery_router
from .api.v1.admission_enquiry import router as admission_enquiry_router
from .api.v1.profile import router as profile_router
from .core.database import engine, Base
from . import models
from .models.password_reset_request import PasswordResetRequest

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GreenPark School Parent Portal API",
    swagger_ui_parameters={"persistAuthorization": True}
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/api/v1", tags=["Authentication"])
app.include_router(parents_router, prefix="/api/v1", tags=["Parents"])
app.include_router(attendance_router, prefix="/api/v1/attendance", tags=["Attendance"])
app.include_router(marks_router, prefix="/api/v1/marks", tags=["Marks"])
app.include_router(fees_router, prefix="/api/v1/fees", tags=["Fees"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(fee_structure_router, prefix="/api/fee-structure", tags=["Fee Structure"])
app.include_router(gallery_router, prefix="/api/v1", tags=["Gallery"])
app.include_router(admission_enquiry_router, prefix="/api/v1", tags=["Admission Enquiry"])
app.include_router(profile_router, prefix="/api/v1/profile", tags=["Profile"])


@app.get("/")
def read_root():
    return {"message": "Welcome to GreenPark School Parent Portal API"}
