from sqlalchemy.orm import Session

from app.crud import dashboard_crud
from app.services import permission_service
from app.models.enums import DeviceStatus, VitalStatus
from app.schemas.dashboard.alert_response import DashboardAlertResponse
from app.schemas.dashboard.patient_response import DashboardPatientResponse
from app.schemas.dashboard.summary_response import DashboardSummaryResponse


# 대시보드 요약 조회
def get_dashboard_summary(
    db: Session,
    user_id: int,
) -> DashboardSummaryResponse:

    department = permission_service.get_department_or_403(
        db=db,
        user_id=user_id,
    )

    summary = dashboard_crud.get_dashboard_summary(
        db=db,
        department_id=department.department_id,
    )

    return DashboardSummaryResponse(**summary)


# 대시보드 환자 목록 조회
def get_dashboard_patients(
    db: Session,
    user_id: int,
) -> list[DashboardPatientResponse]:

    department = permission_service.get_department_or_403(
        db=db,
        user_id=user_id,
    )

    patients = dashboard_crud.get_dashboard_patients(
        db=db,
        department_id=department.department_id,
    )

    severity_map = {
        VitalStatus.NORMAL: "normal",
        VitalStatus.WARNING: "warning",
        VitalStatus.ALERT: "caution",
        VitalStatus.DANGER: "emergency",
    }

    sensor_status_map = {
        DeviceStatus.ACTIVE: "연결됨",
        DeviceStatus.OFFLINE: "연결 끊김",
        DeviceStatus.ERROR: "신호 이상",
    }

    response = []

    for patient in patients:

        response.append(
            DashboardPatientResponse(
                patient_id=patient["patient_id"],
                name=patient["name"],
                room=patient["room"],
                presence_label="재실중" if patient["presence_label"] else "부재중",
                severity=severity_map[patient["severity"]],
                heart_rate=patient["heart_rate"],
                respiration_rate=patient["respiration_rate"],
                sensor_status=sensor_status_map[patient["sensor_status"]],
                timestamp=patient["timestamp"],
                notes=patient["notes"],
            )
        )

    return response


# 최근 알림 조회
def get_recent_alerts(
    db: Session,
    user_id: int,
) -> list[DashboardAlertResponse]:

    department = permission_service.get_department_or_403(
        db=db,
        user_id=user_id,
    )

    alerts = dashboard_crud.get_recent_alerts(
        db=db,
        department_id=department.department_id,
    )

    return [DashboardAlertResponse(**alert) for alert in alerts]
