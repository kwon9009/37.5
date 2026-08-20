from sqlalchemy.orm import Session

from app.crud import monitoring_crud
from app.models.enums import VitalStatus
from app.schemas.monitoring.monitoring_response import (
    RealtimeMonitoringResponse,
    RealtimePatientResponse,
    WardResponse,
)
from app.services import permission_service


# 실시간 모니터링 조회
def get_realtime_monitoring(
    db: Session,
    user_id: int,
) -> RealtimeMonitoringResponse:

    department = permission_service.get_department_or_403(
        db=db,
        user_id=user_id,
    )

    ward_rows = monitoring_crud.get_wards(
        db=db,
        department_id=department.department_id,
    )

    patient_rows = monitoring_crud.get_realtime_patients(
        db=db,
        department_id=department.department_id,
    )

    severity_priority = {
        VitalStatus.DANGER: 0,
        VitalStatus.ALERT: 1,
        VitalStatus.WARNING: 2,
        VitalStatus.NORMAL: 3,
    }

    # Response 생성 전에 정렬
    patient_rows.sort(
        key=lambda row: (
            severity_priority.get(row[1].status, 99),
            row[0].room_num,
            row[0].bed_num,
        )
    )

    wards = []

    for ward, count in ward_rows:
        wards.append(
            WardResponse(
                ward=ward,
                count=count,
            )
        )

    patients = []

    for patient, vital, device in patient_rows:

        patients.append(
            RealtimePatientResponse(
                patient_id=patient.patient_id,
                name=patient.name,
                ward=patient.ward,
                room=f"{patient.room_num}호 · {patient.bed_num}번",
                vital_status=vital.status,
                heart_rate=vital.heart_rate,
                resp_rate=vital.resp_rate,
                device_status=device.status,
                is_present=patient.is_present,
                measured_at=vital.updated_at,
            )
        )

    return RealtimeMonitoringResponse(
        wards=wards,
        patients=patients,
    )
