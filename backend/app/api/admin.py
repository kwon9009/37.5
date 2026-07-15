from fastapi import APIRouter, Depends

from app.dependencies.auth import require_role
from app.models.enums import UserRole

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)


@router.get("/dashboard")
def dashboard():
    return {"message": "관리자 페이지"}


@router.get("/users")
def users():
    return {"message": "회원 관리"}


@router.get("/statistics")
def statistics():
    return {"message": "통계"}
