from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from app.core.database import get_db
from app.schemas.auth.find_id_request import FindIdRequest
from app.schemas.auth.find_id_response import FindIdResponse
from app.schemas.auth.login_id_check_response import LoginIdCheckResponse
from app.schemas.auth.login_request import LoginRequest
from app.schemas.auth.login_response import LoginResponse
from app.schemas.auth.message_response import MessageResponse
from app.schemas.auth.password_reset_request import (
    PasswordResetConfirm,
    PasswordResetRequest,
)
from app.services.auth_service import (
    check_login_id,
    confirm_password_reset,
    find_login_id,
    login_user,
    register_department,
    register_guardian,
    request_password_reset,
    verify_password_reset_token,
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


# 아이디 찾기 (이름 + 이메일, 로그인 불필요)
@router.post(
    "/find-id",
    response_model=FindIdResponse,
)
def find_id_api(
    request: FindIdRequest,
    db: Session = Depends(get_db),
) -> FindIdResponse:
    return find_login_id(
        db=db,
        request=request,
    )


# 비밀번호 재설정 메일 요청 (로그인 불필요)
@router.post(
    "/password-reset/request",
    response_model=MessageResponse,
)
def request_password_reset_api(
    request: PasswordResetRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    return request_password_reset(
        db=db,
        request=request,
    )


# 재설정 링크가 아직 유효한지 확인 (화면이 열릴 때 부른다, 아무것도 바꾸지 않음)
@router.get(
    "/password-reset/verify",
    response_model=MessageResponse,
)
def verify_password_reset_api(
    token: str = Query(..., min_length=10),
    db: Session = Depends(get_db),
) -> MessageResponse:
    return verify_password_reset_token(
        db=db,
        token=token,
    )


# 메일 링크로 새 비밀번호 설정 (로그인 불필요, 링크의 토큰으로 본인 확인)
@router.post(
    "/password-reset/confirm",
    response_model=MessageResponse,
)
def confirm_password_reset_api(
    request: PasswordResetConfirm,
    db: Session = Depends(get_db),
) -> MessageResponse:
    return confirm_password_reset(
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
