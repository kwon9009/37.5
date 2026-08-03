from typing import Literal

from pydantic import BaseModel


class StreamTicketRequest(BaseModel):
    """실시간 스트림 접속 티켓 발급 요청.

    scope="patient"    : 환자 1명만 본다 (보호자 앱, 환자 상세 화면)
                         -> patient_id 필수
    scope="department" : 우리 부서 환자 전체를 본다 (병원 대시보드)
                         -> patient_id 불필요
    """

    scope: Literal["patient", "department"]
    patient_id: int | None = None
