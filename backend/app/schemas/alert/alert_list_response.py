from datetime import datetime

from pydantic import BaseModel

from app.models.enums import VitalStatus


class AlertItemResponse(BaseModel):
    alert_id: int

    patient_name: str

    room: str

    message: str

    status: VitalStatus

    is_read: bool

    sent_at: datetime


class AlertListResponse(BaseModel):
    total_count: int

    unread_count: int

    alerts: list[AlertItemResponse]
