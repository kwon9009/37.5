from datetime import date, datetime, time, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud import patient_crud

from app.models.enums import PatientStatus, UserRole, VitalStatus
from app.models.patient import Patient
from app.models.user import User
from app.services import permission_service

from app.schemas.patient.common import (
    CurrentVitalResponse,
    GuardianResponse,
    PatientInfoResponse,
)
from app.schemas.patient.patient_create import (
    PatientCreateRequest,
    PatientCreateResponse,
)
from app.schemas.patient.patient_detail_response import (
    PatientDetailResponse,
)
from app.schemas.patient.patient_discharge_response import (
    PatientDischargeResponse,
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


# 환자 등록
def create_patient(
    db: Session,
    body: PatientCreateRequest,
    current_user: User,
) -> PatientCreateResponse:

    department = permission_service.get_department_or_403(
        db=db,
        user_id=current_user.user_id,
    )

    patient = patient_crud.create_patient(
        db=db,
        patient=Patient(
            department_id=department.department_id,
            patient_no="",  # patient_id 확정 후 채움
            name=body.name,
            birthdate=body.birth_date,
            gender=body.gender,
            ward=body.ward,
            room_num=body.room_num,
            bed_num=body.bed_num,
            special_notes=body.special_notes,
            status=PatientStatus.ADMITTED,
            is_present=True,
            admission_date=date.today(),
        ),
    )

    patient.patient_no = f"P-{date.today().year}-{patient.patient_id:04d}"

    db.commit()
    db.refresh(patient)

    return PatientCreateResponse(
        patient_id=patient.patient_id,
        patient_no=patient.patient_no,
        name=patient.name,
    )


# 환자 퇴원 처리
def discharge_patient(
    db: Session,
    patient_id: int,
    current_user: User,
) -> PatientDischargeResponse:

    if current_user.role == UserRole.GUARDIAN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="보호자 계정은 퇴원 처리를 할 수 없습니다.",
        )

    patient = permission_service.ensure_can_access_patient(
        db=db,
        current_user=current_user,
        patient_id=patient_id,
    )

    if patient.status == PatientStatus.DISCHARGED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 퇴원 처리된 환자입니다.",
        )

    patient = patient_crud.discharge_patient(
        db=db,
        patient_id=patient_id,
    )

    return PatientDischargeResponse(
        patient_id=patient.patient_id,
        status=patient.status,
        discharge_date=patient.discharge_date,
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
#
# target_date를 주면 그 날 하루(00:00~24:00), 안 주면 최근 24시간을 준다.
# 전부 주지 않는 이유: 1분 평균이라 하루에 1440행씩 쌓이는데, 화면들은
# 몇 초마다 이 API를 다시 부른다. 며칠만 지나도 매번 수만 행을 보내게 된다.
def get_patient_vital_logs(
    db: Session,
    patient_id: int,
    current_user: User,
    target_date: date | None = None,
):
    permission_service.ensure_can_access_patient(
        db=db,
        current_user=current_user,
        patient_id=patient_id,
    )

    if target_date is None:
        end = datetime.now()
        start = end - timedelta(hours=24)
    else:
        start = datetime.combine(target_date, time.min)
        end = start + timedelta(days=1)

    rows = patient_crud.get_patient_vital_logs(
        db=db,
        patient_id=patient_id,
        start=start,
        end=end,
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
