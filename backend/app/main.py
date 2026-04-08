from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1.auth import router as auth_router
from .api.v1.parents import router as parents_router
from .api.v1.attendance import router as attendance_router
from .api.v1.marks import router as marks_router
from .api.v1.fees import router as fees_router
from .api.v1.admin import router as admin_router
from .api.v1.fee_structure import router as fee_structure_router
from .core.database import engine, Base
from .models.password_reset_request import PasswordResetRequest

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GreenPark School Parent Portal API",
    swagger_ui_parameters={"persistAuthorization": True}
)

# Add Bearer Token security scheme for Swagger
app.swagger_ui_oauth2_redirect_url = "/api/v1/login"


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


from fastapi.openapi.utils import get_openapi

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="GreenPark School Parent Portal API",
        version="1.0.0",
        description="This is the GreenPark School Parent Portal API documentation",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "Bearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    # Set security for all endpoints (or you can do it per route)
    for route in openapi_schema["paths"].values():
        for method in route.values():
            if "security" not in method:
                method["security"] = [{"Bearer": []}]
                
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

@app.get("/")
def read_root():
    return {"message": "Welcome to GreenPark School Parent Portal API"}
