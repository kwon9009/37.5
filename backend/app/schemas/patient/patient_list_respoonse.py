from datetime import date, datetime

from pydantic import BaseModel

from app.models.enums import Gender, PatientStatus, VitalStatus


class PatientListItemResponse(BaseModel):
    patient_id: int
    name: str
    gender: Gender
    birthdate: date

    room_num: int
    bed_num: int

    department_name: str

    patient_status: PatientStatus

    vital_status: VitalStatus | None

    heart_rate: int | None
    resp_rate: int | None

    updated_at: datetime | None


class PatientListResponse(BaseModel):
    patients: list[PatientListItemResponse]
