from datetime import date, datetime

from pydantic import BaseModel

from app.models.enums import PatientLinkRequestStatus


class PatientLinkRequestResponse(BaseModel):
    """보호자가 자기 신청 상태를 볼 때 쓰는 응답 (대기 화면).

    병원 이름을 함께 담는다. 보호자 화면에는 "○○병원 승인을 기다리는 중"
    처럼 병원 이름이 나와야 하는데, 이것 때문에 병원을 또 조회하게 하면
    화면이 요청을 두 번 보내야 한다.
    """

    model_config = {"from_attributes": True}

    request_id: int
    hospital_id: int
    hospital_name: str
    patient_name: str
    birthdate: date
    relation: str
    status: PatientLinkRequestStatus
    created_at: datetime
    processed_at: datetime | None = None
