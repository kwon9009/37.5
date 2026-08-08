from pydantic import BaseModel, Field


class PatientLinkRequestDecision(BaseModel):
    """병원이 신청을 승인하거나 거절할 때 보내는 내용.

    승인하려면 어느 환자와 연결할지(patient_id)를 반드시 지정해야 한다.
    신청서에는 이름과 생년월일만 있어서, 동명이인이 있으면 서버가 혼자
    고를 수 없다. 엉뚱한 환자에게 연결되면 남의 생체정보가 보이게 된다.
    """

    approve: bool

    # 승인일 때만 필요하다. 거절이면 보내지 않아도 된다.
    patient_id: int | None = Field(default=None, ge=1)
