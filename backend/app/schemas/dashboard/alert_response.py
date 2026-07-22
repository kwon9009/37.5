from datetime import datetime

from pydantic import BaseModel


class RecentAlertResponse(BaseModel):
    alert_id: int

    patient_id: int
    patient_name: str

    message: str

    is_read: bool

    created_at: datetime
