from pydantic import BaseModel, Field


class HospitalRequestCreate(BaseModel):
    hospital_name: str = Field(..., min_length=1, max_length=50)
    area: str = Field(..., min_length=1, max_length=20)
    address: str = Field(..., min_length=1, max_length=255)
    bed_count: int = Field(..., ge=0)
