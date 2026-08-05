from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from app.core.database import get_db
from app.schemas.auth.login_id_check_response import LoginIdCheckResponse
from app.schemas.auth.login_request import LoginRequest
from app.schemas.auth.login_response import LoginResponse
from app.services.auth_service import (
    check_login_id,
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


# 아이디 중복 확인 (회원가입 화면, 로그인 불필요)
# 길이 제한은 회원가입 요청과 똑같이 맞춰야, 여기서 통과한 아이디가 가입에서 거부되지 않는다.
@router.get(
    "/check-login-id",
    response_model=LoginIdCheckResponse,
)
def check_login_id_api(
    login_id: str = Query(..., min_length=4, max_length=30),
    db: Session = Depends(get_db),
) -> LoginIdCheckResponse:
    return check_login_id(
        db=db,
        login_id=login_id,
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


@router.post(
    "/token",
    response_model=LoginResponse,
)
def login_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):

    request = LoginRequest(
        login_id=form_data.username,
        password=form_data.password,
    )

    return login_user(
        db=db,
        request=request,
    )
