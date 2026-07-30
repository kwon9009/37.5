from sqlalchemy.orm import Session

from app.models.enums import VitalStatus
from app.models.patient import Patient
from app.models.vital_check import VitalCheck
from app.models.vital_log import VitalLog


# 환자 조회
def get_patient(
    db: Session,
    patient_id: int,
) -> Patient | None:

    return db.query(Patient).filter(Patient.patient_id == patient_id).first()


# 현재 상태 조회 (환자당 1행)
def get_vital_check(
    db: Session,
    patient_id: int,
) -> VitalCheck | None:

    return db.query(VitalCheck).filter(VitalCheck.patient_id == patient_id).first()


# 현재 상태 저장 - 있으면 UPDATE, 없으면 INSERT
# (1초마다 행을 쌓으면 DB가 터지므로 환자당 1행만 덮어쓴다)
def upsert_vital_check(
    db: Session,
    patient_id: int,
    heart_rate: int,
    resp_rate: int,
    status: VitalStatus,
) -> VitalCheck:

    vital_check = get_vital_check(db=db, patient_id=patient_id)

    if vital_check is None:

        vital_check = VitalCheck(
            patient_id=patient_id,
            heart_rate=heart_rate,
            resp_rate=resp_rate,
            status=status,
        )
        db.add(vital_check)

    else:

        vital_check.heart_rate = heart_rate
        vital_check.resp_rate = resp_rate
        vital_check.status = status

    db.commit()
    db.refresh(vital_check)

    return vital_check


# 재실 여부 갱신 (값이 바뀔 때만 저장)
def update_presence(
    db: Session,
    patient: Patient,
    is_present: bool,
) -> None:

    if patient.is_present == is_present:
        return

    patient.is_present = is_present
    db.commit()


# 1분 평균 이력 추가 (recorded_at은 DB가 현재시각으로 채운다)
def create_vital_log(
    db: Session,
    patient_id: int,
    avg_heart_rate: int,
    avg_resp_rate: int,
) -> VitalLog:

    vital_log = VitalLog(
        patient_id=patient_id,
        avg_heart_rate=avg_heart_rate,
        avg_resp_rate=avg_resp_rate,
    )

    db.add(vital_log)
    db.commit()

    return vital_log
