from pydantic import BaseModel

from app.models.enums import DeviceStatus, VitalStatus


class WardResponse(BaseModel):
    ward: str
    count: int


class RealtimePatientResponse(BaseModel):
    patient_id: int

    name: str

    ward: str
    room: str

    vital_status: VitalStatus

    heart_rate: int
    resp_rate: int

    device_status: DeviceStatus

    is_present: bool


class RealtimeMonitoringResponse(BaseModel):
    wards: list[WardResponse]
    patients: list[RealtimePatientResponse]
