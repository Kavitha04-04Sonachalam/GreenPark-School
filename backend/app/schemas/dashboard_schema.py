from pydantic import BaseModel

class DashboardSummary(BaseModel):
    total_students: int
    total_parents: int
    total_classes: int
    total_activities: int
    today_fees_collected: float = 0.0
    month_fees_collected: float = 0.0
    pending_fees_total: float = 0.0

