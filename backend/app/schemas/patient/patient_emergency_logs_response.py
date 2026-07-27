from datetime import datetime

from pydantic import BaseModel


class EmergencyLogResponse(BaseModel):
    heart_rate: int
    resp_rate: int
    event_type: str
    created_at: datetime


class PatientEmergencyLogsResponse(BaseModel):
    emergency_logs: list[EmergencyLogResponse]
