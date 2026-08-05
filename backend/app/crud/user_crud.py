from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


# login_id로 사용자 조회
def get_by_login_id(
    db: Session,
    login_id: str,
) -> User | None:
    stmt = select(User).where(User.login_id == login_id)
    return db.scalar(stmt)


# user_id로 사용자 조회
def get_by_user_id(
    db: Session,
    user_id: int,
) -> User | None:
    stmt = select(User).where(User.user_id == user_id)
    return db.scalar(stmt)


# login_id 존재 여부 확인
def exists_by_login_id(
    db: Session,
    login_id: str,
) -> bool:
    return (
        get_by_login_id(
            db=db,
            login_id=login_id,
        )
        is not None
    )


# 이메일로 사용자 조회
def get_by_email(
    db: Session,
    email: str,
) -> User | None:
    stmt = select(User).where(User.email == email)
    return db.scalar(stmt)


# 이메일 존재 여부 확인
def exists_by_email(
    db: Session,
    email: str,
) -> bool:
    return (
        get_by_email(
            db=db,
            email=email,
        )
        is not None
    )


# 사용자 생성
def create_user(
    db: Session,
    user: User,
) -> User:

    db.add(user)
    db.flush()

    return user
