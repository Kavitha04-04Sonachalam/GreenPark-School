from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
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
from .api.v1.social import router as social_router
from .api.v1.academic_year import router as academic_year_router
from .api.v1.fee_category import router as fee_category_router
from .api.v1.scholarship import router as scholarship_router
from .api.v1.fee_reports import router as fee_reports_router
from .api.v1.staff import router as staff_router
from .core.database import engine, Base
from . import models
from .models.password_reset_request import PasswordResetRequest

scheduler = BackgroundScheduler()

# Create tables
Base.metadata.create_all(bind=engine)

# Seed Terms if empty
from .core.database import SessionLocal
from .models.term import Term
db = SessionLocal()
try:
    if db.query(Term).count() == 0:
        db.add_all([
            Term(term_name='Term 1'),
            Term(term_name='Term 2'),
            Term(term_name='Term 3'),
            Term(term_name='Annual')
        ])
        db.commit()
except Exception as e:
    print(f"Error seeding terms: {e}")
finally:
    db.close()

# Initialize Background Sync Scheduler (Runs every 60 seconds on Local School Server)
scheduler = BackgroundScheduler()
if settings.APP_ENV != "cloud":
    scheduler.add_job(sync_service.run_sync_cycle, 'interval', seconds=60, id='two_way_sync', replace_existing=True)

app = FastAPI(
    title="GreenPark School Parent Portal API",
    swagger_ui_parameters={"persistAuthorization": True}
)

@app.on_event("startup")
def start_sync_scheduler():
    try:
        if settings.APP_ENV != "cloud" and scheduler.get_jobs():
            if not scheduler.running:
                scheduler.start()
                print("[SYNC] Background sync scheduler started on Local School Server (runs every 60 seconds).")
        else:
            print("[SYNC] Cloud mode active. Direct cloud database writes enabled; background sync scheduler idle.")
    except Exception as e:
        print(f"[SYNC] Error starting scheduler: {e}")

@app.on_event("shutdown")
def stop_sync_scheduler():
    try:
        if scheduler.running:
            scheduler.shutdown(wait=False)
    except Exception:
        pass

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
app.include_router(fees_router, prefix="/api/v1", tags=["Fee Payment"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(fee_structure_router, prefix="/api/v1", tags=["Fee Structure"])
app.include_router(gallery_router, prefix="/api/v1", tags=["Gallery"])
app.include_router(admission_enquiry_router, prefix="/api/v1", tags=["Admission Enquiry"])
app.include_router(profile_router, prefix="/api/v1/profile", tags=["Profile"])
app.include_router(social_router, prefix="/api/v1/social", tags=["Social Media"])
app.include_router(academic_year_router, prefix="/api/v1", tags=["Academic Years"])
app.include_router(fee_category_router, prefix="/api/v1", tags=["Fee Categories"])
app.include_router(scholarship_router, prefix="/api/v1", tags=["Scholarships"])
app.include_router(fee_reports_router, prefix="/api/v1", tags=["Fee Reports"])
app.include_router(staff_router, prefix="/api/v1", tags=["Staff"])



@app.get("/")
def read_root():
    return {"message": "Welcome to GreenPark School Parent Portal API"}
