from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.department import Department
from app.models.enums import PatientLinkRequestStatus
from app.models.patient import Patient
from app.models.patient_guardian import PatientGuardian
from app.models.patient_link_request import PatientLinkRequest


# 연동 신청 저장
def create(
    db: Session,
    request: PatientLinkRequest,
) -> PatientLinkRequest:
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


def get_by_id(
    db: Session,
    request_id: int,
) -> PatientLinkRequest | None:
    stmt = (
        select(PatientLinkRequest)
        .where(PatientLinkRequest.request_id == request_id)
        .options(
            joinedload(PatientLinkRequest.hospital),
            joinedload(PatientLinkRequest.guardian),
        )
    )
    return db.scalar(stmt)


# 이 보호자가 같은 병원·같은 환자로 이미 대기 중인 신청을 냈는지.
#
# 예전에는 DB의 UNIQUE 제약이 막아줬는데, 한 번 거절되면 같은 정보로 영영
# 재신청을 못 하는 문제가 있어서 제약을 없앴다(2026-08-05).
# 그래서 "대기 중인 것만 중복 금지"는 여기서 직접 검사한다.
def find_pending_duplicate(
    db: Session,
    guardian_id: int,
    hospital_id: int,
    patient_name: str,
    birthdate: date,
) -> PatientLinkRequest | None:
    stmt = select(PatientLinkRequest).where(
        PatientLinkRequest.guardian_id == guardian_id,
        PatientLinkRequest.hospital_id == hospital_id,
        PatientLinkRequest.patient_name == patient_name,
        PatientLinkRequest.birthdate == birthdate,
        PatientLinkRequest.status == PatientLinkRequestStatus.PENDING,
    )
    return db.scalar(stmt)


# 보호자가 낸 신청 목록 (최근 것부터)
def list_by_guardian(
    db: Session,
    guardian_id: int,
) -> list[PatientLinkRequest]:
    stmt = (
        select(PatientLinkRequest)
        .where(PatientLinkRequest.guardian_id == guardian_id)
        .options(joinedload(PatientLinkRequest.hospital))
        .order_by(PatientLinkRequest.created_at.desc())
    )
    return list(db.scalars(stmt))


# 병원으로 들어온 신청 목록 (최근 것부터). status를 주면 그 상태만 본다.
def list_by_hospital(
    db: Session,
    hospital_id: int,
    status: PatientLinkRequestStatus | None = None,
) -> list[PatientLinkRequest]:
    stmt = (
        select(PatientLinkRequest)
        .where(PatientLinkRequest.hospital_id == hospital_id)
        .options(joinedload(PatientLinkRequest.guardian))
    )

    if status is not None:
        stmt = stmt.where(PatientLinkRequest.status == status)

    stmt = stmt.order_by(PatientLinkRequest.created_at.desc())

    return list(db.scalars(stmt))


# 신청서의 이름·생년월일과 맞는 그 병원 환자를 찾는다 (승인할 때 고를 후보).
#
# 환자는 병원에 직접 붙어 있지 않고 부서(department)를 거쳐 붙어 있어서
# patients -> departments 로 조인해야 병원을 알 수 있다.
def find_matching_patients(
    db: Session,
    hospital_id: int,
    patient_name: str,
    birthdate: date,
) -> list[Patient]:
    stmt = (
        select(Patient)
        .join(Department, Patient.department_id == Department.department_id)
        .where(
            Department.hospital_id == hospital_id,
            Patient.name == patient_name,
            Patient.birthdate == birthdate,
        )
        .options(joinedload(Patient.department))
        .order_by(Patient.patient_id)
    )
    return list(db.scalars(stmt))


# 보호자와 환자가 이미 연결돼 있는지
def link_exists(
    db: Session,
    patient_id: int,
    guardian_id: int,
) -> bool:
    stmt = select(PatientGuardian.patient_guardian_id).where(
        PatientGuardian.patient_id == patient_id,
        PatientGuardian.guardian_id == guardian_id,
    )
    return db.scalar(stmt) is not None


# 보호자와 환자를 연결한다 (승인 시)
def create_link(
    db: Session,
    patient_id: int,
    guardian_id: int,
    relation: str,
) -> PatientGuardian:
    link = PatientGuardian(
        patient_id=patient_id,
        guardian_id=guardian_id,
        relation=relation,
    )
    db.add(link)
    return link
