from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.crud.department_crud import (
    create_department,
    exists_by_hospital_and_name,
)
from app.crud.hospital_crud import get_by_id as get_hospital_by_id
from app.crud.guardian_crud import create_guardian
from app.crud.user_crud import (
    create_user,
    exists_by_email,
    exists_by_login_id,
    get_by_login_id,
)
from app.models.department import Department
from app.models.enums import UserRole
from app.models.guardian import Guardian
from app.models.user import User
from app.schemas.auth.department_register_request import (
    DepartmentRegisterRequest,
)
from app.schemas.auth.guardian_register_request import (
    GuardianRegisterRequest,
)
from app.schemas.auth.login_request import LoginRequest
from app.schemas.auth.login_response import LoginResponse
from app.schemas.auth.register_response import RegisterResponse


# 사용자 JWT 생성
def _generate_access_token(user: User) -> str:
    return create_access_token(
        data={
            "sub": user.login_id,
            "user_id": user.user_id,
            "role": user.role.value,
        }
    )


# login_id 중복 검사
def _validate_login_id(
    db: Session,
    login_id: str,
) -> None:
    if exists_by_login_id(
        db=db,
        login_id=login_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 사용 중인 아이디입니다.",
        )


# 이메일 중복 검사
def _validate_email(
    db: Session,
    email: str,
) -> None:
    if exists_by_email(
        db=db,
        email=email,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 사용 중인 이메일입니다.",
        )


# 로그인
def login_user(
    db: Session,
    request: LoginRequest,
) -> LoginResponse:
    user = get_by_login_id(
        db=db,
        login_id=request.login_id,
    )

    if user is None or not verify_password(
        request.password,
        user.password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 올바르지 않습니다.",
        )

    access_token = _generate_access_token(user)

    return LoginResponse(
        access_token=access_token,
        token_type="Bearer",
        user_id=user.user_id,
        role=user.role,
    )


# 보호자 회원가입
def register_guardian(
    db: Session,
    request: GuardianRegisterRequest,
) -> RegisterResponse:

    _validate_login_id(
        db=db,
        login_id=request.login_id,
    )

    try:
        user = User(
            login_id=request.login_id,
            password=hash_password(request.password),
            role=UserRole.GUARDIAN,
        )

        create_user(
            db=db,
            user=user,
        )

        guardian = Guardian(
            user_id=user.user_id,
            name=request.name,
            phone=request.phone,
        )

        create_guardian(
            db=db,
            guardian=guardian,
        )

        db.commit()

        db.refresh(user)
        db.refresh(guardian)

    except Exception:
        db.rollback()
        raise

    return RegisterResponse(
        user_id=user.user_id,
        login_id=user.login_id,
        role=user.role,
        message="회원가입이 완료되었습니다.",
    )


# 병원 회원가입
def register_department(
    db: Session,
    request: DepartmentRegisterRequest,
) -> RegisterResponse:

    hospital = get_hospital_by_id(
        db=db,
        hospital_id=request.hospital_id,
    )

    if hospital is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 병원입니다.",
        )

    _validate_login_id(
        db=db,
        login_id=request.login_id,
    )

    _validate_email(
        db=db,
        email=request.email,
    )

    if exists_by_hospital_and_name(
        db=db,
        hospital_id=hospital.hospital_id,
        department_name=request.department_name,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 가입된 진료과입니다.",
        )

    try:
        user = User(
            login_id=request.login_id,
            email=request.email,
            password=hash_password(request.password),
            role=UserRole.DEPARTMENT,
        )

        create_user(
            db=db,
            user=user,
        )

        department = Department(
            hospital_id=hospital.hospital_id,
            user_id=user.user_id,
            name=request.department_name,
        )

        create_department(
            db=db,
            department=department,
        )

        db.commit()

        db.refresh(user)
        db.refresh(department)

    except Exception:
        db.rollback()
        raise

    return RegisterResponse(
        user_id=user.user_id,
        login_id=user.login_id,
        role=user.role,
        message="회원가입이 완료되었습니다.",
    )
