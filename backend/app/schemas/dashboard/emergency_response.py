from datetime import datetime

from pydantic import BaseModel


class EmergencyEventResponse(BaseModel):
    emergency_log_id: int

    patient_id: int
    patient_name: str

    heart_rate: int
    resp_rate: int

    event_type: str

    created_at: datetime
