from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud import patient_crud
from app.schemas.patient.common import (
    CurrentVitalResponse,
    GuardianResponse,
    PatientInfoResponse,
)
from app.schemas.patient.patient_detail_response import (
    PatientDetailResponse,
)
from app.schemas.patient.patient_vital_logs_response import (
    PatientVitalLogsResponse,
    VitalLogResponse,
)
from app.schemas.patient.patient_alert_response import (
    AlertResponse,
    PatientAlertResponse,
)


# 환자 상세 조회
def get_patient_detail(
    db: Session,
    patient_id: int,
):
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
            respiration_rate=vital_check.resp_rate,
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


# 환자 Vital Log 조회
def get_patient_vital_logs(
    db: Session,
    patient_id: int,
):
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
):
    rows = patient_crud.get_patient_alerts(
        db=db,
        patient_id=patient_id,
    )

    alerts = []

    for row in rows:
        alerts.append(
            AlertResponse(
                message=row.message,
                status=row.status,
                is_read=row.is_read,
                sent_at=row.sent_at,
            )
        )

    return PatientAlertResponse(
        alerts=alerts,
    )
