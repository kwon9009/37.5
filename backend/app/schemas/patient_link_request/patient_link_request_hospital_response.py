from datetime import date, datetime

from pydantic import BaseModel

from app.models.enums import PatientLinkRequestStatus


class MatchingPatientResponse(BaseModel):
    """신청서의 이름·생년월일과 맞는 그 병원 환자.

    승인할 때 어느 환자와 연결할지 고르는 후보다.
    동명이인이 있을 수 있어서 병동·호실까지 같이 보여준다.
    """

    model_config = {"from_attributes": True}

    patient_id: int
    patient_no: str
    name: str
    birthdate: date
    ward: str
    room_num: int
    bed_num: int


class PatientLinkRequestHospitalResponse(BaseModel):
    """병원이 신청 목록을 볼 때 쓰는 응답.

    신청한 보호자가 누구인지(이름·연락처)와, 연결 후보 환자를 함께 담는다.
    병원 담당자가 이 화면만 보고 승인/거절을 판단할 수 있어야 하기 때문이다.
    """

    model_config = {"from_attributes": True}

    request_id: int
    guardian_id: int
    guardian_name: str
    guardian_phone: str
    patient_name: str
    birthdate: date
    relation: str
    status: PatientLinkRequestStatus
    created_at: datetime
    processed_at: datetime | None = None

    # 이름·생년월일이 맞는 그 병원 환자들.
    # 비어 있으면 그런 환자가 없다는 뜻이라 승인할 수 없다.
    matching_patients: list[MatchingPatientResponse] = []
