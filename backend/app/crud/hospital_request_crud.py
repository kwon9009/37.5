from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import HospitalRequestStatus
from app.models.hospital_request import HospitalRequest


def create(
    db: Session,
    hospital_request: HospitalRequest,
) -> HospitalRequest:
    db.add(hospital_request)
    db.commit()
    db.refresh(hospital_request)
    return hospital_request


def list_all(db: Session) -> list[HospitalRequest]:
    stmt = select(HospitalRequest).order_by(HospitalRequest.created_at.desc())
    return list(db.scalars(stmt))


def get_by_id(
    db: Session,
    hospital_request_id: int,
) -> HospitalRequest | None:
    stmt = select(HospitalRequest).where(
        HospitalRequest.hospital_request_id == hospital_request_id
    )
    return db.scalar(stmt)
