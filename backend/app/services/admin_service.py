import re

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud import admin_crud, hospital_crud
from app.schemas.admin.hospital_list_response import AdminHospitalListItem
from app.schemas.admin.admin_name_response import AdminNameResponse
from app.schemas.admin.admin_hospital_create_request import (
    AdminHospitalCreateRequest,
)
from app.schemas.admin.admin_hospital_create_response import (
    AdminHospitalCreateResponse,
)


# 주소에서 "OO구" 추출
def _extract_district(address: str) -> str:
    match = re.search(r"\S+구", address)
    return match.group(0) if match else ""


# 관리자 병원관리 목록 조회
def get_hospital_list(
    db: Session,
) -> list[AdminHospitalListItem]:

    rows = hospital_crud.list_all_with_stats(db)

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


# 관리자 병원 직접 추가
def create_hospital(
    db: Session,
    request: AdminHospitalCreateRequest,
) -> AdminHospitalCreateResponse:

    # 담당 관리자가 지정되지 않은 경우
    # 시스템 관리자(admin_id=1)를 사용한다.
    admin_id = request.admin_id if request.admin_id is not None else 1

    # 관리자 존재 여부 확인
    admin = admin_crud.get_admin_by_id(
        db=db,
        admin_id=admin_id,
    )

    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 관리자입니다.",
        )

    # 병원 코드 중복 확인
    existing_hospital = hospital_crud.get_by_code(
        db=db,
        hospital_code=request.hospital_code,
    )

    if existing_hospital is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 사용 중인 병원 코드입니다.",
        )

    # 병원명 + 주소 중복 확인
    existing_hospital = hospital_crud.get_by_name_and_address(
        db=db,
        name=request.name,
        address=request.address,
    )

    if existing_hospital is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 등록된 병원입니다.",
        )

    try:
        # 병원 생성
        hospital = admin_crud.create_hospital(
            db=db,
            name=request.name,
            hospital_code=request.hospital_code,
            area=request.area,
            address=request.address,
            bed_count=request.bed_count,
        )

        # 관리자-병원 관계 생성
        admin_crud.create_admin_hospital(
            db=db,
            admin_id=admin_id,
            hospital_id=hospital.hospital_id,
        )

        # 병원과 관리자 관계를 하나의 트랜잭션으로 확정
        db.commit()

        # DB에서 확정된 병원 정보를 다시 반영
        db.refresh(hospital)

        return AdminHospitalCreateResponse(
            hospital_id=hospital.hospital_id,
            name=hospital.name,
            hospital_code=hospital.hospital_code,
            area=hospital.area,
            address=hospital.address,
            bed_count=hospital.bed_count,
            admin_id=admin.admin_id,
            admin_name=admin.name,
        )

    except Exception:
        db.rollback()
        raise
