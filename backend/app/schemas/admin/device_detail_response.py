from datetime import datetime

from pydantic import BaseModel


class AdminDeviceDetailResponse(BaseModel):
    serial_num: str
    status: str

    ward: str | None
    room_num: int | None
    bed_num: int | None

    hospital_id: int
    hospital_name: str

    created_at: datetime
    updated_at: datetime
