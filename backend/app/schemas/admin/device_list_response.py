from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AdminDeviceListItem(BaseModel):
    device_id: int
    serial_num: str
    hospital_name: str
    ward: str | None
    room_num: int | None
    bed_num: int | None
    status: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminDeviceListResponse(BaseModel):
    items: list[AdminDeviceListItem]
    total: int
    page: int
    page_size: int
