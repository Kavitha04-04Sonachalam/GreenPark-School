from pydantic import BaseModel

class DashboardSummary(BaseModel):
    total_students: int
    total_parents: int
    total_classes: int
    total_activities: int
