from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models.enums import UserRole
from app.schemas.admin.hospital_list_response import AdminHospitalListItem
from app.schemas.admin.admin_name_response import AdminNameResponse
from app.schemas.admin.admin_hospital_create_request import AdminHospitalCreateRequest
from app.schemas.admin.admin_hospital_create_response import AdminHospitalCreateResponse
from app.schemas.admin.hospital_detail_response import AdminHospitalDetailResponse
from app.schemas.admin.hospital_ward_response import AdminHospitalWardResponse
from app.schemas.admin.hospital_device_stats_response import (
    AdminHospitalDeviceStatsResponse,
)
from app.schemas.admin.hospital_update_request import AdminHospitalUpdateRequest
from app.services import admin_service

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)


# 관리자 병원 목록 조회
@router.get(
    "/hospitals",
    response_model=list[AdminHospitalListItem],
)
def list_hospitals(
    db: Session = Depends(get_db),
):
    return admin_service.get_hospital_list(
        db=db,
    )


# 관리자 이름 목록 조회
@router.get(
    "/names",
    response_model=list[AdminNameResponse],
)
def get_admin_names(
    db: Session = Depends(get_db),
):
    return admin_service.get_admin_names(
        db=db,
    )


# 관리자 병원 직접 추가
@router.post(
    "/hospitals",
    response_model=AdminHospitalCreateResponse,
)
def create_hospital(
    request: AdminHospitalCreateRequest,
    db: Session = Depends(get_db),
):
    return admin_service.create_hospital(
        db=db,
        request=request,
    )


# 관리자 병원 상세 조회
@router.get(
    "/hospitals/{hospital_id}",
    response_model=AdminHospitalDetailResponse,
)
def get_hospital_detail(
    hospital_id: int,
    db: Session = Depends(get_db),
):
    return admin_service.get_hospital_detail(
        db=db,
        hospital_id=hospital_id,
    )


# 관리자 병원 병동 현황 조회
@router.get(
    "/hospitals/{hospital_id}/wards",
    response_model=list[AdminHospitalWardResponse],
)
def get_hospital_wards(
    hospital_id: int,
    db: Session = Depends(get_db),
):
    return admin_service.get_hospital_wards(
        db=db,
        hospital_id=hospital_id,
    )


# 관리자 병원 연결 장치 현황 조회
@router.get(
    "/hospitals/{hospital_id}/devices/stats",
    response_model=AdminHospitalDeviceStatsResponse,
)
def get_hospital_device_stats(
    hospital_id: int,
    db: Session = Depends(get_db),
):
    return admin_service.get_hospital_device_stats(
        db=db,
        hospital_id=hospital_id,
    )


# 관리자 병원 정보 수정
@router.put(
    "/hospitals/{hospital_id}",
    response_model=AdminHospitalCreateResponse,
)
def update_hospital(
    hospital_id: int,
    request: AdminHospitalUpdateRequest,
    db: Session = Depends(get_db),
):
    return admin_service.update_hospital(
        db=db,
        hospital_id=hospital_id,
        request=request,
    )
