from pydantic import BaseModel, ConfigDict


class HospitalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    hospital_id: int
    name: str
    area: str
    address: str
