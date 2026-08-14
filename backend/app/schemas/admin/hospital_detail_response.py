from datetime import datetime

from pydantic import BaseModel


class AdminHospitalManagerResponse(BaseModel):
    admin_id: int
    name: str
    email: str
    phone: str


class AdminHospitalDetailResponse(BaseModel):
    hospital_id: int
    name: str
    hospital_code: str
    area: str
    address: str
    bed_count: int
    is_active: bool
    created_at: datetime
    manager: AdminHospitalManagerResponse | None
