from pydantic import BaseModel


class AdminHospitalUpdateRequest(BaseModel):
    name: str
    hospital_code: str
    area: str
    address: str
    bed_count: int
    admin_id: int
