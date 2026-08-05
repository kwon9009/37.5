from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.guardian.guardian_me_response import GuardianMeResponse
from app.schemas.guardian.guardian_update_request import GuardianUpdateRequest
from app.services import guardian_service

router = APIRouter(
    prefix="/guardians",
    tags=["Guardian"],
)


# 로그인한 보호자 본인 + 담당 환자 조회
@router.get(
    "/me",
    response_model=GuardianMeResponse,
)
def get_my_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return guardian_service.get_my_info(
        db=db,
        current_user=current_user,
    )


# 계정 정보 수정 (이름 / 연락처 / 이메일)
@router.patch(
    "/me",
    response_model=GuardianMeResponse,
)
def update_my_info(
    request: GuardianUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return guardian_service.update_my_info(
        db=db,
        current_user=current_user,
        request=request,
    )
