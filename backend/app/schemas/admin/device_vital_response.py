from datetime import datetime

from pydantic import BaseModel


class AdminDeviceVitalResponse(BaseModel):
    status: str
    heart_rate: int | None
    resp_rate: int | None
    recorded_at: datetime | None
