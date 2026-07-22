from datetime import datetime

from pydantic import BaseModel


class DashboardPatientResponse(BaseModel):
    patient_id: int
    patient_no: str
    patient_name: str

    ward: str
    room_num: int
    bed_num: int

    heart_rate: int
    resp_rate: int

    status: str
    device_status: str

    updated_at: datetime
