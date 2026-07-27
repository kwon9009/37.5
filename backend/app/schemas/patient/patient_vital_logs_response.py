from datetime import datetime

from pydantic import BaseModel


class VitalLogResponse(BaseModel):
    avg_heart_rate: int
    avg_resp_rate: int
    recorded_at: datetime


class PatientVitalLogsResponse(BaseModel):
    vital_logs: list[VitalLogResponse]
