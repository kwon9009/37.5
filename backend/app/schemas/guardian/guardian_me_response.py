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
    # 가입 때부터 받는 값이지만, 이전에 가입한 계정은 비어 있을 수 있어 nullable
    email: str | None
    patients: list[MyPatientResponse]
