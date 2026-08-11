from pydantic import BaseModel, Field


class AdminHospitalCreateRequest(BaseModel):
    name: str = Field(..., max_length=50)
    hospital_code: str = Field(..., max_length=10)
    area: str = Field(..., max_length=20)
    address: str = Field(..., max_length=255)
    bed_count: int = Field(..., ge=0)
    admin_id: int | None = None
