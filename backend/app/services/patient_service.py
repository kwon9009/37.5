from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud import patient_crud

from app.models.enums import UserRole, VitalStatus
from app.models.user import User
from app.services import permission_service

from app.schemas.patient.common import (
    CurrentVitalResponse,
    GuardianResponse,
    PatientInfoResponse,
)
from app.schemas.patient.patient_detail_response import (
    PatientDetailResponse,
)
from app.schemas.patient.patient_special_notes_update import (
    PatientSpecialNotesUpdateResponse,
)
from app.schemas.patient.patient_vital_logs_response import (
    PatientVitalLogsResponse,
    VitalLogResponse,
)
from app.schemas.patient.patient_alert_response import (
    AlertResponse,
    PatientAlertResponse,
)
from app.schemas.patient.patient_emergency_logs_response import (
    EmergencyLogResponse,
    PatientEmergencyLogsResponse,
)
from app.schemas.patient.patient_list_respoonse import (
    PatientListItemResponse,
    PatientListResponse,
)


# 환자 상세 조회
def get_patient_detail(
    db: Session,
    patient_id: int,
    current_user: User,
):
    permission_service.ensure_can_access_patient(
        db=db,
        current_user=current_user,
        patient_id=patient_id,
    )

    result = patient_crud.get_patient_detail(
        db=db,
        patient_id=patient_id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="환자를 찾을 수 없습니다.",
        )

    patient = result["patient"]
    department = result["department"]
    hospital = result["hospital"]
    device = result["device"]
    vital_check = result["vital_check"]
    guardian = result["guardian"]

    guardian_response = None
    if guardian:
        guardian_response = GuardianResponse(
            guardian_id=guardian.guardian_id,
            name=guardian.name,
            phone=guardian.phone,
        )

    current_vital = None
    if vital_check:
        current_vital = CurrentVitalResponse(
            heart_rate=vital_check.heart_rate,
            resp_rate=vital_check.resp_rate,
            measured_at=vital_check.updated_at,
        )

    return PatientDetailResponse(
        patient=PatientInfoResponse(
            patient_id=patient.patient_id,
            name=patient.name,
            gender=patient.gender,
            birth_date=patient.birthdate,
            ward=patient.ward,
            room_num=patient.room_num,
            bed_num=patient.bed_num,
            status=patient.status,
            is_present=patient.is_present,
            special_notes=patient.special_notes,
            department=department.name,
            hospital=hospital.name,
        ),
        guardian=guardian_response,
        device_serial=device.serial_num if device else None,
        current_vital=current_vital,
    )


# 환자 특이사항 수정 (고혈압·협심증 병력, 항혈전제·심장약 복용, 흉통 호소 여부 등 관리)
def update_patient_special_notes(
    db: Session,
    patient_id: int,
    special_notes: str,
    current_user: User,
) -> PatientSpecialNotesUpdateResponse:

    if current_user.role == UserRole.GUARDIAN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="보호자 계정은 특이사항을 수정할 수 없습니다.",
        )

    permission_service.ensure_can_access_patient(
        db=db,
        current_user=current_user,
        patient_id=patient_id,
    )

    patient = patient_crud.update_special_notes(
        db=db,
        patient_id=patient_id,
        special_notes=special_notes,
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="환자를 찾을 수 없습니다.",
        )

    return PatientSpecialNotesUpdateResponse(
        patient_id=patient.patient_id,
        special_notes=patient.special_notes,
    )


# 환자 Vital Log 조회
def get_patient_vital_logs(
    db: Session,
    patient_id: int,
    current_user: User,
):
    permission_service.ensure_can_access_patient(
        db=db,
        current_user=current_user,
        patient_id=patient_id,
    )

    rows = patient_crud.get_patient_vital_logs(
        db=db,
        patient_id=patient_id,
    )

    response = []

    for row in rows:
        response.append(
            VitalLogResponse(
                avg_heart_rate=row.avg_heart_rate,
                avg_resp_rate=row.avg_resp_rate,
                recorded_at=row.recorded_at,
            )
        )

    return PatientVitalLogsResponse(
        vital_logs=response,
    )


# 환자 Alert 조회
def get_patient_alerts(
    db: Session,
    patient_id: int,
    current_user: User,
):
    permission_service.ensure_can_access_patient(
        db=db,
        current_user=current_user,
        patient_id=patient_id,
    )

    rows = patient_crud.get_patient_alerts(
        db=db,
        patient_id=patient_id,
    )

    alerts = []

    for row in rows:
        alerts.append(
            AlertResponse(
                alert_id=row.alert_id,
                message=row.message,
                status=row.status,
                is_read=row.is_read,
                sent_at=row.sent_at,
            )
        )

    return PatientAlertResponse(
        alerts=alerts,
    )


# 환자 응급 기록 조회
def get_patient_emergency_logs(
    db: Session,
    patient_id: int,
    current_user: User,
):
    permission_service.ensure_can_access_patient(
        db=db,
        current_user=current_user,
        patient_id=patient_id,
    )

    rows = patient_crud.get_patient_emergency_logs(
        db=db,
        patient_id=patient_id,
    )

    emergency_logs = []

    for row in rows:
        emergency_logs.append(
            EmergencyLogResponse(
                heart_rate=row.heart_rate,
                resp_rate=row.resp_rate,
                event_type=row.event_type,
                created_at=row.created_at,
            )
        )

    return PatientEmergencyLogsResponse(
        emergency_logs=emergency_logs,
    )


# 환자 목록 조회
def get_patients(
    db: Session,
    user_id: int,
    keyword: str | None = None,
    room_num: int | None = None,
    status: VitalStatus | None = None,
) -> PatientListResponse:

    department = permission_service.get_department_or_403(
        db=db,
        user_id=user_id,
    )

    rows = patient_crud.get_patients(
        db=db,
        department_id=department.department_id,
        keyword=keyword,
        room_num=room_num,
        status=status,
    )

    patients = []

    for patient, department, vital_check in rows:

        patients.append(
            PatientListItemResponse(
                patient_id=patient.patient_id,
                name=patient.name,
                gender=patient.gender,
                birthdate=patient.birthdate,
                room_num=patient.room_num,
                bed_num=patient.bed_num,
                department_name=department.name,
                patient_status=patient.status,
                vital_status=vital_check.status if vital_check else None,
                heart_rate=vital_check.heart_rate if vital_check else None,
                resp_rate=vital_check.resp_rate if vital_check else None,
                updated_at=vital_check.updated_at if vital_check else None,
            )
        )

    return PatientListResponse(
        patients=patients,
    )
