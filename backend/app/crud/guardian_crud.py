from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.guardian import Guardian
from app.models.patient_guardian import PatientGuardian


# 보호자 생성
def create_guardian(
    db: Session,
    guardian: Guardian,
) -> Guardian:
    db.add(guardian)
    db.flush()

    return guardian


# User ID로 보호자 조회
def get_by_user_id(
    db: Session,
    user_id: int,
) -> Guardian | None:

    stmt = select(Guardian).where(Guardian.user_id == user_id)

    return db.scalar(stmt)


# 보호자가 담당하는 환자 연결 목록 (환자 정보까지 함께 조회)
def get_patient_links(
    db: Session,
    guardian_id: int,
) -> list[PatientGuardian]:

    stmt = (
        select(PatientGuardian)
        .options(joinedload(PatientGuardian.patient))
        .where(PatientGuardian.guardian_id == guardian_id)
    )

    return list(db.scalars(stmt).all())


# 이 환자가 해당 보호자의 환자인지 확인
def is_linked_to_patient(
    db: Session,
    guardian_id: int,
    patient_id: int,
) -> bool:

    stmt = select(PatientGuardian).where(
        PatientGuardian.guardian_id == guardian_id,
        PatientGuardian.patient_id == patient_id,
    )

    return db.scalar(stmt) is not None
