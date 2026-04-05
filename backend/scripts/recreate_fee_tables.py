import asyncio
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from backend.app.core.database import engine, Base
from backend.app.models.fee_component import FeeComponent
from backend.app.models.fee_structure import FeeStructure

# We drop both to ensure clean start for the new models
FeeComponent.__table__.drop(engine, checkfirst=True)
FeeStructure.__table__.drop(engine, checkfirst=True)

Base.metadata.create_all(bind=engine)
print("Tables dropped and recreated successfully.")
