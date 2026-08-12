from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AdminDeviceListItem(BaseModel):
    device_id: int
    serial_num: str
    hospital_name: str
    ward: str
    room_num: int
    bed_num: int
    status: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminDeviceListResponse(BaseModel):
    items: list[AdminDeviceListItem]
    total: int
    page: int
    page_size: int
