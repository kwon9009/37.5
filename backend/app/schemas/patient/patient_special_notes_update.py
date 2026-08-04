from pydantic import BaseModel


class PatientSpecialNotesUpdateRequest(BaseModel):
    special_notes: str


class PatientSpecialNotesUpdateResponse(BaseModel):
    patient_id: int
    special_notes: str
