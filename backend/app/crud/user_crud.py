from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


def get_by_login_id(
    db: Session,
    login_id: str,
) -> User | None:
    """
    login_id로 사용자 조회
    """
    stmt = select(User).where(User.login_id == login_id)
    return db.scalar(stmt)


def get_by_user_id(
    db: Session,
    user_id: int,
) -> User | None:
    """
    user_id로 사용자 조회
    """
    stmt = select(User).where(User.user_id == user_id)
    return db.scalar(stmt)
