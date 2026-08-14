from pydantic import BaseModel


class AdminHospitalStatusUpdateRequest(BaseModel):
    is_active: bool
