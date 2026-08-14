from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.crud.admin_crud import get_admin_by_user_id
from app.crud.user_crud import get_by_user_id
from app.models.admin import Admin
from app.models.enums import UserRole
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/token",
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:

    payload = decode_access_token(token)

    user_id = payload.get("user_id")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다.",
        )

    user = get_by_user_id(
        db=db,
        user_id=user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자를 찾을 수 없습니다.",
        )

    return user


def require_role(
    *roles: UserRole,
):

    def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:

        if current_user.role not in roles:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="접근 권한이 없습니다.",
            )

        return current_user

    return role_checker


# 로그인한 ADMIN 유저의 Admin 레코드를 가져온다.
# 병원 접근 범위 확인(admin_hospitals)에 admin_id가 필요해서
# require_role(ADMIN)만으로는 부족한 라우터에서 이걸 대신 쓴다.
def get_current_admin(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> Admin:

    admin = get_admin_by_user_id(
        db=db,
        user_id=current_user.user_id,
    )

    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 계정 정보를 찾을 수 없습니다.",
        )

    return admin
