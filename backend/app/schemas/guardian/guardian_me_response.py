from pydantic import BaseModel

from app.models.enums import PatientStatus


class MyPatientResponse(BaseModel):
    """보호자와 연결된 환자 요약."""

    patient_id: int
    name: str
    relation: str
    ward: str
    room_num: int
    bed_num: int
    status: PatientStatus
    is_present: bool


class GuardianMeResponse(BaseModel):
    """보호자 앱이 시작할 때 부르는 '나와 내 환자' 정보."""

    guardian_id: int
    name: str
    phone: str
    patients: list[MyPatientResponse]
