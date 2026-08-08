from pydantic import BaseModel, ConfigDict


class HospitalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    hospital_id: int
    hospital_code: str
    name: str
    area: str
    address: str
