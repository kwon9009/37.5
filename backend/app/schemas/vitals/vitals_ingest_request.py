from datetime import datetime

from pydantic import BaseModel


class VitalsIngestRequest(BaseModel):
    """라즈베리파이가 1초마다 보내는 측정값.

    사람이 없거나 센서 신호가 끊기면 heart_rate/breath_rate가 None으로 온다.
    (하드웨어는 breath_rate로 보내고, DB 컬럼명은 resp_rate다)
    """

    patient_id: int
    heart_rate: int | None = None
    breath_rate: int | None = None
    presence: bool = True
    measured_at: datetime | None = None
