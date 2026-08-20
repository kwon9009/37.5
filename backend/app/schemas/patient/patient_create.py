from datetime import date

from pydantic import BaseModel, Field

from app.models.enums import Gender


class PatientCreateRequest(BaseModel):
    name: str = Field(..., max_length=20)
    gender: Gender
    birth_date: date
    ward: str = Field(..., max_length=20)
    room_num: int = Field(..., ge=0)
    bed_num: int = Field(..., ge=0)
    special_notes: str = ""


class PatientCreateResponse(BaseModel):
    patient_id: int
    patient_no: str
    name: str
