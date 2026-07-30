import re

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud.hospital_crud import list_all_with_stats
from app.dependencies.auth import require_role
from app.models.enums import UserRole
from app.schemas.admin.hospital_list_response import AdminHospitalListItem

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)


# 주소에서 "OO구"만 뽑아내기 (대전 스코프 전용)
def _extract_district(address: str) -> str:
    match = re.search(r"\S+구", address)
    return match.group(0) if match else ""


@router.get("/hospitals", response_model=list[AdminHospitalListItem])
def list_hospitals(db: Session = Depends(get_db)):
    rows = list_all_with_stats(db)
    return [
        AdminHospitalListItem(
            hospital_id=hospital.hospital_id,
            name=hospital.name,
            region=_extract_district(hospital.address),
            beds=hospital.bed_count,
            devices=device_count,
            manager=manager_name or "-",
            active=True,
        )
        for hospital, device_count, manager_name in rows
    ]


@router.get("/dashboard")
def dashboard():
    return {"message": "관리자 페이지"}


@router.get("/users")
def users():
    return {"message": "회원 관리"}


@router.get("/statistics")
def statistics():
    return {"message": "통계"}
