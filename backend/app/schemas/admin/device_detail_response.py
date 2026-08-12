from datetime import datetime

from pydantic import BaseModel


class AdminDeviceDetailResponse(BaseModel):
    serial_num: str
    status: str

    ward: str
    room_num: int
    bed_num: int

    hospital_id: int
    hospital_name: str

    created_at: datetime
    updated_at: datetime
