from datetime import date

from pydantic import BaseModel

from app.models.enums import PatientStatus


class PatientDischargeResponse(BaseModel):
    patient_id: int
    status: PatientStatus
    discharge_date: date | None
