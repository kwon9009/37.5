from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models.enums import PatientLinkRequestStatus, UserRole
from app.models.user import User
from app.schemas.patient_link_request.patient_link_request_create import (
    PatientLinkRequestCreate,
)
from app.schemas.patient_link_request.patient_link_request_decision import (
    PatientLinkRequestDecision,
)
from app.schemas.patient_link_request.patient_link_request_hospital_response import (
    PatientLinkRequestHospitalResponse,
)
from app.schemas.patient_link_request.patient_link_request_response import (
    PatientLinkRequestResponse,
)
from app.services import patient_link_service

router = APIRouter(
    prefix="/patient-link-requests",
    tags=["Patient Link Request"],
)


# 보호자가 환자 연동을 신청한다 (회원가입 마지막 단계)
@router.post(
    "",
    response_model=PatientLinkRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_request(
    request: PatientLinkRequestCreate,
    current_user: User = Depends(require_role(UserRole.GUARDIAN)),
    db: Session = Depends(get_db),
) -> PatientLinkRequestResponse:
    return patient_link_service.submit_request(
        db=db,
        current_user=current_user,
        request=request,
    )


# 내가 낸 신청 목록 (승인 대기 화면에서 상태를 확인한다)
@router.get(
    "/me",
    response_model=list[PatientLinkRequestResponse],
)
def list_my_requests(
    current_user: User = Depends(require_role(UserRole.GUARDIAN)),
    db: Session = Depends(get_db),
) -> list[PatientLinkRequestResponse]:
    return patient_link_service.list_my_requests(
        db=db,
        current_user=current_user,
    )


# 우리 병원으로 들어온 신청 목록 (병원 담당자용)
# 부서 계정은 자기 병원만 보이고, 관리자는 hospital_id로 병원을 지정한다.
@router.get(
    "",
    response_model=list[PatientLinkRequestHospitalResponse],
)
def list_hospital_requests(
    request_status: PatientLinkRequestStatus | None = Query(default=None, alias="status"),
    hospital_id: int | None = Query(default=None, ge=1),
    current_user: User = Depends(require_role(UserRole.DEPARTMENT, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> list[PatientLinkRequestHospitalResponse]:
    return patient_link_service.list_hospital_requests(
        db=db,
        current_user=current_user,
        request_status=request_status,
        hospital_id=hospital_id,
    )


# 신청 승인 / 거절 (병원 담당자용)
@router.patch(
    "/{request_id}",
    response_model=PatientLinkRequestHospitalResponse,
)
def decide_request(
    decision: PatientLinkRequestDecision,
    request_id: int = Path(..., ge=1),
    current_user: User = Depends(require_role(UserRole.DEPARTMENT, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> PatientLinkRequestHospitalResponse:
    return patient_link_service.decide_request(
        db=db,
        current_user=current_user,
        request_id=request_id,
        decision=decision,
    )
