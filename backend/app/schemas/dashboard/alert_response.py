from datetime import datetime

from pydantic import BaseModel


class DashboardAlertResponse(BaseModel):
    alert_id: int
    patient_name: str
    room: str
    message: str
    is_read: bool
    sent_at: datetime
