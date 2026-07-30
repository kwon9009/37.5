from datetime import datetime

from pydantic import BaseModel

from app.models.enums import PatientStatus


class GuardianResponse(BaseModel):
    guardian_id: int
    name: str
    phone: str


class CurrentVitalResponse(BaseModel):
    heart_rate: int | None
    resp_rate: int | None
    measured_at: datetime | None


class PatientInfoResponse(BaseModel):
    patient_id: int
    name: str
    gender: str
    birth_date: datetime
    ward: str
    room_num: int
    bed_num: int
    status: PatientStatus
    is_present: bool
    special_notes: str | None
    department: str
    hospital: str
