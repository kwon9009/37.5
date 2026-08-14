from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_admin, require_role
from app.models.admin import Admin
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
from app.schemas.admin.hospital_status_update_request import (
    AdminHospitalStatusUpdateRequest,
)
from app.schemas.admin.device_list_response import AdminDeviceListResponse
from app.schemas.admin.device_detail_response import AdminDeviceDetailResponse
from app.schemas.admin.device_vital_response import AdminDeviceVitalResponse
from app.schemas.admin.device_create_request import AdminDeviceCreateRequest
from app.schemas.admin.device_create_response import AdminDeviceCreateResponse
from app.schemas.admin.hospital_admin_create_request import (
    AdminHospitalAdminCreateRequest,
)
from app.schemas.admin.hospital_admin_create_response import (
    AdminHospitalAdminCreateResponse,
)
from app.schemas.admin.user_list_response import AdminUserListItem
from app.schemas.admin.user_status_update_request import AdminUserStatusUpdateRequest
from app.schemas.admin.system_settings_response import AdminSystemSettingsResponse
from app.schemas.admin.system_settings_update_request import (
    AdminSystemSettingsUpdateRequest,
)
from app.services import admin_service

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)


# 관리자 병원 목록 조회 (슈퍼관리자는 전체, 병원 소속 관리자는 자기 병원만)
@router.get(
    "/hospitals",
    response_model=list[AdminHospitalListItem],
)
def list_hospitals(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return admin_service.get_hospital_list(
        db=db,
        current_admin=current_admin,
    )


# 관리자 이름 목록 조회 (슈퍼관리자 전용)
@router.get(
    "/names",
    response_model=list[AdminNameResponse],
)
def get_admin_names(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return admin_service.get_admin_names(
        db=db,
        current_admin=current_admin,
    )


# 관리자 병원 직접 추가 (슈퍼관리자 전용)
@router.post(
    "/hospitals",
    response_model=AdminHospitalCreateResponse,
)
def create_hospital(
    request: AdminHospitalCreateRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return admin_service.create_hospital(
        db=db,
        request=request,
        current_admin=current_admin,
    )


# 관리자 병원 상세 조회
@router.get(
    "/hospitals/{hospital_id}",
    response_model=AdminHospitalDetailResponse,
)
def get_hospital_detail(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return admin_service.get_hospital_detail(
        db=db,
        hospital_id=hospital_id,
        current_admin=current_admin,
    )


# 관리자 병원 병동 현황 조회
@router.get(
    "/hospitals/{hospital_id}/wards",
    response_model=list[AdminHospitalWardResponse],
)
def get_hospital_wards(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return admin_service.get_hospital_wards(
        db=db,
        hospital_id=hospital_id,
        current_admin=current_admin,
    )


# 관리자 병원 연결 장치 현황 조회
@router.get(
    "/hospitals/{hospital_id}/devices/stats",
    response_model=AdminHospitalDeviceStatsResponse,
)
def get_hospital_device_stats(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return admin_service.get_hospital_device_stats(
        db=db,
        hospital_id=hospital_id,
        current_admin=current_admin,
    )


# 관리자 병원 정보 수정 (슈퍼관리자 전용)
@router.put(
    "/hospitals/{hospital_id}",
    response_model=AdminHospitalCreateResponse,
)
def update_hospital(
    hospital_id: int,
    request: AdminHospitalUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return admin_service.update_hospital(
        db=db,
        hospital_id=hospital_id,
        request=request,
        current_admin=current_admin,
    )


# 관리자 병원 활성/비활성 상태 변경
@router.patch(
    "/hospitals/{hospital_id}/status",
    response_model=AdminHospitalDetailResponse,
)
def update_hospital_status(
    hospital_id: int,
    request: AdminHospitalStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return admin_service.update_hospital_status(
        db=db,
        hospital_id=hospital_id,
        request=request,
        current_admin=current_admin,
    )


# 병원 소속 관리자 계정 발급 (슈퍼관리자 전용)
@router.post(
    "/hospitals/{hospital_id}/admins",
    response_model=AdminHospitalAdminCreateResponse,
)
def create_hospital_admin(
    hospital_id: int,
    request: AdminHospitalAdminCreateRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return admin_service.create_hospital_admin(
        db=db,
        hospital_id=hospital_id,
        request=request,
        current_admin=current_admin,
    )


# 관리자 장치 재고 등록 (슈퍼관리자 전용 - 결제/과금과 얽혀 있음)
@router.post(
    "/devices",
    response_model=AdminDeviceCreateResponse,
)
def create_device(
    request: AdminDeviceCreateRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return admin_service.create_device(
        db=db,
        request=request,
        current_admin=current_admin,
    )


# 관리자 장치 목록 조회
@router.get(
    "/devices",
    response_model=AdminDeviceListResponse,
)
def get_device_list(
    search: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 5,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return admin_service.get_device_list(
        db=db,
        current_admin=current_admin,
        search=search,
        status=status,
        page=page,
        page_size=page_size,
    )


# 관리자 장치 상세 조회
@router.get(
    "/devices/{device_id}",
    response_model=AdminDeviceDetailResponse,
)
def get_device_detail(
    device_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return admin_service.get_device_detail(
        db=db,
        device_id=device_id,
        current_admin=current_admin,
    )


# 권한관리 화면 - 전체 계정 목록 (슈퍼관리자 전용)
@router.get(
    "/users",
    response_model=list[AdminUserListItem],
)
def list_users(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return admin_service.list_users(
        db=db,
        current_admin=current_admin,
    )


# 권한관리 화면 - 계정 활성/비활성 변경 (슈퍼관리자 전용)
@router.patch(
    "/users/{user_id}/status",
    response_model=AdminUserListItem,
)
def update_user_status(
    user_id: int,
    request: AdminUserStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return admin_service.update_user_status(
        db=db,
        user_id=user_id,
        request=request,
        current_admin=current_admin,
    )


# 관리자 장치 최신 생체 측정값 조회
@router.get(
    "/devices/{device_id}/vitals/latest",
    response_model=AdminDeviceVitalResponse,
)
def get_device_latest_vital(
    device_id: int,
    db: Session = Depends(get_db),
):
    return admin_service.get_device_latest_vital(
        db=db,
        device_id=device_id,
    )


# 알림 관리 화면 - 시스템 설정 조회 (슈퍼관리자 전용)
@router.get(
    "/settings",
    response_model=AdminSystemSettingsResponse,
)
def get_system_settings(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return admin_service.get_system_settings(
        db=db,
        current_admin=current_admin,
    )


# 알림 관리 화면 - 시스템 설정 변경 (슈퍼관리자 전용)
@router.put(
    "/settings",
    response_model=AdminSystemSettingsResponse,
)
def update_system_settings(
    request: AdminSystemSettingsUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
):
    return admin_service.update_system_settings(
        db=db,
        request=request,
        current_admin=current_admin,
    )
