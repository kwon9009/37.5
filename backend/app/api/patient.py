from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.enums import VitalStatus
from app.models.user import User
from app.schemas.patient.patient_detail_response import (
    PatientDetailResponse,
)
from app.schemas.patient.patient_vital_logs_response import (
    PatientVitalLogsResponse,
)
from app.schemas.patient.patient_alert_response import (
    PatientAlertResponse,
)
from app.schemas.patient.patient_emergency_logs_response import (
    PatientEmergencyLogsResponse,
)
from app.schemas.patient.patient_list_respoonse import (
    PatientListResponse,
)
from app.services import patient_service

router = APIRouter(
    prefix="/patients",
    tags=["Patient"],
)


# 환자 상세 조회
@router.get(
    "/{patient_id}",
    response_model=PatientDetailResponse,
)
def get_patient_detail(
    patient_id: int,
    db: Session = Depends(get_db),
):
    return patient_service.get_patient_detail(
        db=db,
        patient_id=patient_id,
    )


# 환자 Vital Log 조회
@router.get(
    "/{patient_id}/vital-logs",
    response_model=PatientVitalLogsResponse,
)
def get_patient_vital_logs(
    patient_id: int,
    db: Session = Depends(get_db),
):
    return patient_service.get_patient_vital_logs(
        db=db,
        patient_id=patient_id,
    )


# 환자 Alert 조회
@router.get(
    "/{patient_id}/alerts",
    response_model=PatientAlertResponse,
)
def get_patient_alerts(
    patient_id: int,
    db: Session = Depends(get_db),
):
    return patient_service.get_patient_alerts(
        db=db,
        patient_id=patient_id,
    )


# 환자 응급 기록 조회
@router.get(
    "/{patient_id}/emergency-logs",
    response_model=PatientEmergencyLogsResponse,
)
def get_patient_emergency_logs(
    patient_id: int,
    db: Session = Depends(get_db),
):
    return patient_service.get_patient_emergency_logs(
        db=db,
        patient_id=patient_id,
    )


# 환자 목록 조회
@router.get(
    "",
    response_model=PatientListResponse,
)
def get_patients(
    keyword: str | None = None,
    room_num: int | None = None,
    status: VitalStatus | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    return patient_service.get_patients(
        db=db,
        user_id=current_user.user_id,
        keyword=keyword,
        room_num=room_num,
        status=status,
    )
