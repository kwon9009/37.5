from datetime import date

from pydantic import BaseModel, Field


class PatientLinkRequestCreate(BaseModel):
    """보호자가 내는 환자 연동 신청.

    병원은 hospital_id 가 아니라 병원 코드로 받는다.
    보호자는 문자로 받은 코드만 알고 있고, 내부 번호는 모르기 때문이다.
    """

    hospital_code: str = Field(..., min_length=1, max_length=10)
    patient_name: str = Field(..., min_length=1, max_length=20)
    birthdate: date
    relation: str = Field(..., min_length=1, max_length=20)
