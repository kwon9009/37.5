from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models.enums import UserRole
from app.schemas.hospital_request.hospital_request_create import (
    HospitalRequestCreate,
)
from app.schemas.hospital_request.hospital_request_response import (
    HospitalRequestResponse,
)
from app.services import hospital_request_service

router = APIRouter(
    prefix="/hospital-requests",
    tags=["Hospital Request"],
)


# 병원 직접 등록 요청 (회원가입 화면에서 사용, 로그인 불필요)
@router.post(
    "",
    response_model=HospitalRequestResponse,
)
def submit_hospital_request(
    request: HospitalRequestCreate,
    db: Session = Depends(get_db),
):
    return hospital_request_service.submit_hospital_request(db=db, request=request)


# 등록 요청 목록 (관리자 전용)
@router.get(
    "",
    response_model=list[HospitalRequestResponse],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
def list_hospital_requests(
    db: Session = Depends(get_db),
):
    return hospital_request_service.list_hospital_requests(db)


# 등록 요청 승인 -> hospitals 테이블에 실제 반영 (관리자 전용)
@router.post(
    "/{hospital_request_id}/approve",
    response_model=HospitalRequestResponse,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
def approve_hospital_request(
    hospital_request_id: int,
    db: Session = Depends(get_db),
):
    return hospital_request_service.approve_hospital_request(db, hospital_request_id)


# 등록 요청 거절 (관리자 전용)
@router.post(
    "/{hospital_request_id}/reject",
    response_model=HospitalRequestResponse,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
def reject_hospital_request(
    hospital_request_id: int,
    db: Session = Depends(get_db),
):
    return hospital_request_service.reject_hospital_request(db, hospital_request_id)
