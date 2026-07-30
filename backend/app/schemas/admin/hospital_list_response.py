from pydantic import BaseModel


class AdminHospitalListItem(BaseModel):
    hospital_id: int
    name: str
    region: str
    beds: int
    devices: int
    manager: str
    active: bool
