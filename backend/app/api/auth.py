from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth.login_request import LoginRequest
from app.schemas.auth.login_response import LoginResponse
from app.services.auth_service import (
    login_user,
    register_department,
    register_guardian,
)
from app.schemas.auth.department_register_request import (
    DepartmentRegisterRequest,
)
from app.schemas.auth.guardian_register_request import (
    GuardianRegisterRequest,
)
from app.schemas.auth.register_response import RegisterResponse

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


# 로그인
@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    return login_user(
        db=db,
        request=request,
    )


# 보호자 회원가입
@router.post(
    "/register/guardian",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_guardian_api(
    request: GuardianRegisterRequest,
    db: Session = Depends(get_db),
) -> RegisterResponse:
    return register_guardian(
        db=db,
        request=request,
    )


# 병원 회원가입
@router.post(
    "/register/department",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_department_api(
    request: DepartmentRegisterRequest,
    db: Session = Depends(get_db),
) -> RegisterResponse:
    return register_department(
        db=db,
        request=request,
    )
