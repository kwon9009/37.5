import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core import mailer
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
    hash_password,
    password_fingerprint,
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
    get_by_email,
    get_by_login_id,
    get_by_user_id,
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
from app.schemas.auth.register_response import RegisterResponse

logger = logging.getLogger(__name__)


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


# 아이디 중복 확인 (회원가입 화면의 '중복확인' 버튼)
# 가입 버튼을 누른 뒤에야 중복을 알려주면 입력한 내용을 다시 채워야 해서,
# 아이디를 적는 시점에 미리 알려준다. 실제 중복 차단은 가입 시 한 번 더 한다.
def check_login_id(
    db: Session,
    login_id: str,
) -> LoginIdCheckResponse:
    if exists_by_login_id(
        db=db,
        login_id=login_id,
    ):
        return LoginIdCheckResponse(
            available=False,
            message="이미 사용 중인 아이디입니다.",
        )

    return LoginIdCheckResponse(
        available=True,
        message="사용할 수 있는 아이디입니다.",
    )


# 아이디 일부를 가린다. 예) guardian01 -> gua*****01
# 전부 보여주면 이름과 이메일만 아는 사람이 남의 아이디를 그대로 가져갈 수 있다.
# 짧은 아이디도 반드시 한 글자 이상 가려지도록 남길 글자 수를 길이에 맞춰 줄인다.
def _mask_login_id(login_id: str) -> str:
    keep_front = 3 if len(login_id) >= 7 else 2
    keep_back = 2 if len(login_id) >= 6 else 1

    hidden = len(login_id) - keep_front - keep_back

    if hidden < 1:
        # 가릴 자리조차 없을 만큼 짧으면 첫 글자만 남긴다
        return login_id[0] + "*" * (len(login_id) - 1)

    return f"{login_id[:keep_front]}{'*' * hidden}{login_id[-keep_back:]}"


# 아이디 찾기 (이름 + 이메일이 모두 맞아야 함)
# 보호자 앱의 화면이라 보호자 계정만 대상으로 한다.
def find_login_id(
    db: Session,
    request: FindIdRequest,
) -> FindIdResponse:

    not_found = FindIdResponse(
        found=False,
        message="입력하신 정보와 일치하는 계정이 없습니다.",
    )

    user = get_by_email(db=db, email=request.email)

    if user is None or user.role != UserRole.GUARDIAN:
        return not_found

    guardian = user.guardian

    if guardian is None or guardian.name != request.name:
        return not_found

    return FindIdResponse(
        found=True,
        masked_login_id=_mask_login_id(user.login_id),
        message="회원님의 아이디입니다.",
    )


# 비밀번호 재설정 메일 발송
def request_password_reset(
    db: Session,
    request: PasswordResetRequest,
) -> MessageResponse:

    # 아이디가 없든, 이메일이 다르든 항상 같은 답을 준다.
    # 답이 달라지면 "이 아이디는 존재한다"는 사실을 알려주는 셈이 되어,
    # 남의 계정 존재 여부를 확인하는 도구로 쓰일 수 있다.
    same_answer = MessageResponse(
        message="입력하신 정보가 등록되어 있다면 비밀번호 재설정 링크를 메일로 보냈습니다. 메일함을 확인해 주세요.",
    )

    user = get_by_login_id(db=db, login_id=request.login_id)

    if user is None or user.email is None or user.email != request.email:
        return same_answer

    token = create_password_reset_token(
        user_id=user.user_id,
        hashed_password=user.password,
    )

    link = f"{settings.FRONTEND_BASE_URL}/guardian/reset-password?token={token}"

    body = (
        f"{request.login_id} 님,\n\n"
        "아래 링크에서 새 비밀번호를 설정해 주세요.\n\n"
        f"{link}\n\n"
        f"이 링크는 {settings.PASSWORD_RESET_EXPIRE_MINUTES}분 동안만 사용할 수 있고, "
        "한 번 사용하면 무효가 됩니다.\n"
        "본인이 요청한 것이 아니라면 이 메일을 무시하셔도 됩니다. "
        "비밀번호는 그대로 유지됩니다.\n\n"
        "37.5 SmartCare"
    )

    try:
        mailer.send_email(
            to=user.email,
            subject="[37.5 SmartCare] 비밀번호 재설정 안내",
            body=body,
        )

    except Exception:
        # 메일 서버 문제는 사용자가 해결할 수 없으므로 그대로 알려준다.
        # (여기서 같은 답을 주면 사용자는 오지 않는 메일을 계속 기다리게 된다)
        logger.exception("비밀번호 재설정 메일 발송 실패 (user_id=%s)", user.user_id)

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        )

    return same_answer


# 메일 링크를 타고 들어와 새 비밀번호 설정
def confirm_password_reset(
    db: Session,
    request: PasswordResetConfirm,
) -> MessageResponse:

    payload = decode_password_reset_token(request.token)

    user = get_by_user_id(db=db, user_id=int(payload["sub"]))

    # 비밀번호가 이미 바뀌었으면 토큰에 담긴 지문과 달라진다.
    # = 이 링크는 이미 사용됐다는 뜻이다.
    if user is None or payload.get("pwfp") != password_fingerprint(user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용된 링크입니다. 비밀번호 재설정을 다시 요청해 주세요.",
        )

    user.password = hash_password(request.new_password)
    db.commit()

    return MessageResponse(
        message="비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.",
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

    _validate_email(
        db=db,
        email=request.email,
    )

    try:
        user = User(
            login_id=request.login_id,
            email=request.email,
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
