from datetime import datetime

from pydantic import BaseModel
from app.models.enums import VitalStatus


class AlertResponse(BaseModel):
    alert_id: int
    message: str
    status: VitalStatus
    is_read: bool
    sent_at: datetime


class PatientAlertResponse(BaseModel):
    alerts: list[AlertResponse]
