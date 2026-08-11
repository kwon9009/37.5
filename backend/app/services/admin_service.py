import re

from sqlalchemy.orm import Session

from app.crud.hospital_crud import list_all_with_stats
from app.crud import admin_crud
from app.schemas.admin.hospital_list_response import AdminHospitalListItem
from app.schemas.admin.admin_name_response import AdminNameResponse


# 주소에서 "OO구" 추출
def _extract_district(address: str) -> str:
    match = re.search(r"\S+구", address)
    return match.group(0) if match else ""


# 관리자 병원관리 목록 조회
def get_hospital_list(
    db: Session,
) -> list[AdminHospitalListItem]:

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


# 관리자 이름 목록 조회
def get_admin_names(
    db: Session,
) -> list[AdminNameResponse]:

    admins = admin_crud.get_admin_names(
        db=db,
    )

    return [
        AdminNameResponse(
            admin_id=admin.admin_id,
            name=admin.name,
        )
        for admin in admins
    ]
