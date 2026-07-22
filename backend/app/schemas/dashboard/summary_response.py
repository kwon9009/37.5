from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_patients: int
    normal_count: int
    warning_count: int
    alert_count: int
    danger_count: int
