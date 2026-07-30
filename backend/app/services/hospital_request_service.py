from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud import hospital_crud, hospital_request_crud
from app.models.enums import HospitalRequestStatus
from app.models.hospital import Hospital
from app.models.hospital_request import HospitalRequest
from app.schemas.hospital_request.hospital_request_create import (
    HospitalRequestCreate,
)
from app.schemas.hospital_request.hospital_request_response import (
    HospitalRequestResponse,
)


def _to_response(request: HospitalRequest) -> HospitalRequestResponse:
    return HospitalRequestResponse(
        hospital_request_id=request.hospital_request_id,
        hospital_name=request.hospital_name,
        address=request.address,
        bed_count=request.bed_count,
        status=request.status,
        requested_at=request.created_at,
    )


def submit_hospital_request(
    db: Session,
    request: HospitalRequestCreate,
) -> HospitalRequestResponse:
    hospital_request = HospitalRequest(
        hospital_name=request.hospital_name,
        address=request.address,
        bed_count=request.bed_count,
        status=HospitalRequestStatus.PENDING,
    )

    hospital_request_crud.create(db=db, hospital_request=hospital_request)

    return _to_response(hospital_request)


def list_hospital_requests(db: Session) -> list[HospitalRequestResponse]:
    return [_to_response(request) for request in hospital_request_crud.list_all(db)]


def _get_pending_or_404(db: Session, hospital_request_id: int) -> HospitalRequest:
    hospital_request = hospital_request_crud.get_by_id(
        db=db,
        hospital_request_id=hospital_request_id,
    )

    if hospital_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 등록 요청입니다.",
        )

    if hospital_request.status != HospitalRequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 처리된 요청입니다.",
        )

    return hospital_request


def approve_hospital_request(
    db: Session,
    hospital_request_id: int,
) -> HospitalRequestResponse:
    hospital_request = _get_pending_or_404(db, hospital_request_id)

    existing = hospital_crud.get_by_name_and_address(
        db=db,
        name=hospital_request.hospital_name,
        address=hospital_request.address,
    )

    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 등록된 병원입니다.",
        )

    hospital = Hospital(
        name=hospital_request.hospital_name,
        address=hospital_request.address,
        bed_count=hospital_request.bed_count,
        hospital_code=f"REQ{hospital_request.hospital_request_id:06d}",
    )
    db.add(hospital)

    hospital_request.status = HospitalRequestStatus.APPROVED
    db.commit()
    db.refresh(hospital_request)

    return _to_response(hospital_request)


def reject_hospital_request(
    db: Session,
    hospital_request_id: int,
) -> HospitalRequestResponse:
    hospital_request = _get_pending_or_404(db, hospital_request_id)

    hospital_request.status = HospitalRequestStatus.REJECTED
    db.commit()
    db.refresh(hospital_request)

    return _to_response(hospital_request)
