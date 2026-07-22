from datetime import datetime

from pydantic import BaseModel

from app.models.enums import HospitalRequestStatus


class HospitalRequestResponse(BaseModel):
    hospital_request_id: int
    hospital_name: str
    area: str
    address: str
    status: HospitalRequestStatus
    requested_at: datetime

    model_config = {"from_attributes": True}
