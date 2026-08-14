from datetime import datetime

from pydantic import BaseModel


class AdminDeviceCreateResponse(BaseModel):
    device_id: int
    hospital_id: int
    hospital_name: str
    serial_num: str
    status: str
    created_at: datetime
