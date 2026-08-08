from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.department.department_me_response import DepartmentMeResponse
from app.services import permission_service

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

    department = permission_service.get_department_or_403(
        db=db,
        user_id=current_user.user_id,
    )

    return DepartmentMeResponse(
        department_id=department.department_id,
        department_name=department.name,
        hospital_id=department.hospital_id,
        hospital_name=department.hospital.name,
    )
