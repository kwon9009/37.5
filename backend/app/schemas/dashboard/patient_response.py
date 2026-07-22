from datetime import datetime

from pydantic import BaseModel


class DashboardPatientResponse(BaseModel):
    patient_id: int

    name: str

    room: str

    presence_label: str

    severity: str

    heart_rate: int

    respiration_rate: int

    sensor_status: str

    timestamp: datetime

    notes: str
