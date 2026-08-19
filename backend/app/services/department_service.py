from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.crud.user_crud import update_password
from app.models.user import User
from app.schemas.department.department_me_response import DepartmentMeResponse
from app.services import permission_service


# 로그인한 부서 계정 정보 조회
def get_my_department(
    db: Session,
    user_id: int,
) -> DepartmentMeResponse:

    department = permission_service.get_department_or_403(
        db=db,
        user_id=user_id,
    )

    return DepartmentMeResponse(
        department_id=department.department_id,
        department_name=department.name,
        hospital_id=department.hospital_id,
        hospital_name=department.hospital.name,
    )


# 비밀번호 변경
def change_password(
    db: Session,
    user: User,
    current_password: str,
    new_password: str,
) -> None:
    if not verify_password(current_password, user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="현재 비밀번호가 올바르지 않습니다.",
        )

    hashed_password = hash_password(new_password)

    update_password(
        db=db,
        user=user,
        password=hashed_password,
    )
