from pydantic import BaseModel


class AdminHospitalDeviceStatsResponse(BaseModel):
    active: int
    offline: int
    error: int
