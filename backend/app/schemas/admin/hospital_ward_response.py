from pydantic import BaseModel


class AdminHospitalWardResponse(BaseModel):
    department_id: int
    name: str
    beds: int
    occupied: int
    devices: int
