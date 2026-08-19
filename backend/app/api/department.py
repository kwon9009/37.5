from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.department.department_me_response import DepartmentMeResponse
from app.schemas.department.department_password_change_request import (
    DepartmentPasswordChangeRequest,
)
from app.services import department_service

router = APIRouter(
    prefix="/departments",
    tags=["Department"],
)


# 로그인한 부서 계정의 소속 병원 · 부서
# 병원 화면 상단 바에 병원 이름을 띄우는 데 쓴다.
@router.get(
    "/me",
    response_model=DepartmentMeResponse,
)
def get_my_department(
    current_user: User = Depends(require_role(UserRole.DEPARTMENT)),
    db: Session = Depends(get_db),
) -> DepartmentMeResponse:
    return department_service.get_my_department(
        db=db,
        user_id=current_user.user_id,
    )


# 비밀번호 변경 API
@router.patch("/me/password")
def change_department_password_api(
    request: DepartmentPasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.DEPARTMENT)),
):
    # 비밀번호 변경
    department_service.change_password(
        db=db,
        user=current_user,
        current_password=request.current_password,
        new_password=request.new_password,
    )

    return {"message": "비밀번호가 변경되었습니다."}


# 프로필 이미지 변경
@router.post("/me/profile-image")
async def change_department_profile_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.DEPARTMENT)),
):
    profile_image_url = await department_service.change_profile_image(
        db=db,
        user=current_user,
        file=file,
    )

    return {
        "message": "프로필 이미지가 변경되었습니다.",
        "profile_image_url": profile_image_url,
    }
