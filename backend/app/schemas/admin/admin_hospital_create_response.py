from pydantic import BaseModel


class AdminHospitalCreateResponse(BaseModel):
    hospital_id: int
    name: str
    hospital_code: str
    area: str
    address: str
    bed_count: int
    admin_id: int
    admin_name: str
