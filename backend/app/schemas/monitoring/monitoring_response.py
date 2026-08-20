from datetime import datetime

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

    # 값이 언제 측정된 것인지. 화면은 이걸로 '지금 재는 중'인지 판단한다
    # (오래된 값을 현재값처럼 띄우면 멈춘 센서를 정상으로 오해한다)
    measured_at: datetime


class RealtimeMonitoringResponse(BaseModel):
    wards: list[WardResponse]
    patients: list[RealtimePatientResponse]
