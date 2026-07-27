from pydantic import BaseModel

from app.schemas.patient.common import (
    CurrentVitalResponse,
    GuardianResponse,
    PatientInfoResponse,
)


class PatientDetailResponse(BaseModel):
    patient: PatientInfoResponse
    guardian: GuardianResponse | None
    device_serial: str | None
    current_vital: CurrentVitalResponse | None
