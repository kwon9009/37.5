import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import HTTPException, status
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from pwdlib import PasswordHash

from app.core.config import settings

password_hash = PasswordHash.recommended()


credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def hash_password(password: str) -> str:
    """
    비밀번호 암호화
    """
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """
    비밀번호 검증
    """
    return password_hash.verify(
        plain_password,
        hashed_password,
    )


def create_access_token(
    data: dict[str, Any],
) -> str:
    """
    Access Token 생성
    """

    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode["exp"] = expire

    return jwt.encode(
        payload=to_encode,
        key=settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


_RESET_PURPOSE = "password_reset"


def password_fingerprint(hashed_password: str) -> str:
    """현재 비밀번호에서 짧은 지문을 만든다.

    재설정 토큰에 이 값을 넣어두고 나중에 다시 비교한다.
    비밀번호가 바뀌면 지문도 바뀌므로, 한 번 쓴 재설정 링크는 저절로 무효가 된다.
    덕분에 토큰을 DB에 저장하지 않고도 '1회용'을 보장할 수 있다.
    """

    seed = f"{settings.SECRET_KEY}:{hashed_password}".encode()

    return hashlib.sha256(seed).hexdigest()[:16]


def create_password_reset_token(
    user_id: int,
    hashed_password: str,
) -> str:
    """비밀번호 재설정 링크에 담을 토큰 생성."""

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES
    )

    return jwt.encode(
        payload={
            "sub": str(user_id),
            "purpose": _RESET_PURPOSE,
            "pwfp": password_fingerprint(hashed_password),
            "exp": expire,
        },
        key=settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_password_reset_token(
    token: str,
) -> dict[str, Any]:
    """재설정 토큰 검증.

    로그인 토큰과 섞이면 안 되므로 purpose까지 확인한다.
    (로그인 토큰으로 남의 비밀번호를 바꾸는 일을 막는다)
    """

    expired = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="링크가 만료되었습니다. 비밀번호 재설정을 다시 요청해 주세요.",
    )

    invalid = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="유효하지 않은 링크입니다.",
    )

    try:
        payload = jwt.decode(
            jwt=token,
            key=settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

    except ExpiredSignatureError:
        raise expired

    except InvalidTokenError:
        raise invalid

    if payload.get("purpose") != _RESET_PURPOSE:
        raise invalid

    return payload


def decode_access_token(
    token: str,
) -> dict[str, Any]:
    """
    Access Token 검증
    """

    try:

        payload = jwt.decode(
            jwt=token,
            key=settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        return payload

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    except InvalidTokenError:
        raise credentials_exception
