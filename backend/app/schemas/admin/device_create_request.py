from pydantic import BaseModel, Field


class AdminDeviceCreateRequest(BaseModel):
    hospital_id: int
    serial_num: str = Field(..., max_length=20)
