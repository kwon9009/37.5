from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    verify_password,
)
from app.crud.user_crud import get_by_login_id
from app.schemas.user.login_request import LoginRequest
from app.schemas.user.login_response import LoginResponse


def login_user(
    db: Session,
    request: LoginRequest,
) -> LoginResponse:

    user = get_by_login_id(
        db=db,
        login_id=request.login_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 올바르지 않습니다.",
        )

    if not verify_password(
        request.password,
        user.password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="아이디 또는 비밀번호가 올바르지 않습니다.",
        )

    access_token = create_access_token(
        data={
            "sub": user.login_id,
            "user_id": user.user_id,
            "role": user.role.value,
        }
    )

    return LoginResponse(
        access_token=access_token,
        token_type="Bearer",
        user_id=user.user_id,
        role=user.role,
    )
