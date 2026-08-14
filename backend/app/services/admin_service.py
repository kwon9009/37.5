import re

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.crud import (
    admin_crud,
    hospital_crud,
    admin_hospital_crud,
    device_crud,
    system_setting_crud,
    vital_crud,
)
from app.crud import user_crud
from app.crud.user_crud import create_user, exists_by_email, exists_by_login_id
from app.models.admin import Admin
from app.models.enums import DeviceStatus, UserRole
from app.models.user import User
from app.schemas.admin.hospital_list_response import AdminHospitalListItem
from app.schemas.admin.admin_name_response import AdminNameResponse
from app.schemas.admin.admin_hospital_create_request import AdminHospitalCreateRequest
from app.schemas.admin.admin_hospital_create_response import AdminHospitalCreateResponse
from app.schemas.admin.hospital_ward_response import AdminHospitalWardResponse
from app.schemas.admin.hospital_update_request import AdminHospitalUpdateRequest
from app.schemas.admin.hospital_status_update_request import (
    AdminHospitalStatusUpdateRequest,
)
from app.schemas.admin.device_detail_response import AdminDeviceDetailResponse
from app.schemas.admin.device_vital_response import AdminDeviceVitalResponse
from app.schemas.admin.hospital_device_stats_response import (
    AdminHospitalDeviceStatsResponse,
)
from app.schemas.admin.hospital_detail_response import (
    AdminHospitalDetailResponse,
    AdminHospitalManagerResponse,
)
from app.schemas.admin.device_list_response import (
    AdminDeviceListItem,
    AdminDeviceListResponse,
)
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


# 슈퍼관리자(어느 병원에도 안 묶인 관리자)만 할 수 있는 동작인지 확인.
# 병원 신규 등록, 병원 관리자 계정 발급, 장치 재고 등록(결제/과금과 얽힘)은
# 특정 병원 담당자가 임의로 할 수 없게 여기서 막는다.
def _require_super_admin(db: Session, current_admin: Admin) -> None:
    if not admin_crud.is_super_admin(db=db, admin_id=current_admin.admin_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="시스템 관리자만 할 수 있는 작업입니다.",
        )


# 이 관리자가 특정 병원에 접근 가능한지 확인 (슈퍼관리자는 전체 접근 가능)
def _check_hospital_access(db: Session, current_admin: Admin, hospital_id: int) -> None:
    if admin_crud.is_super_admin(db=db, admin_id=current_admin.admin_id):
        return

    accessible_ids = admin_crud.get_accessible_hospital_ids(
        db=db,
        admin_id=current_admin.admin_id,
    )

    if hospital_id not in accessible_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="접근 권한이 없는 병원입니다.",
        )


# 주소에서 시·군·구 추출
#
# 첫 낱말(시·도)은 건너뛴다. "대구광역시 수성구 …"에서 앞부터 찾으면 "대구광역시"
# 안의 "대구"가 먼저 걸려서 지역이 전부 '대구'로 뭉개진다.
# (우리 주소 데이터는 항상 시·도로 시작한다)
#
# 구를 먼저 찾고 없을 때만 시·군을 쓴다. "경기도 성남시 분당구"처럼 둘 다 있으면
# 더 좁은 단위인 구가 병원을 구분하는 데 쓸모 있기 때문이다.
def _extract_district(address: str) -> str:
    tokens = address.split()[1:]

    for token in tokens:
        if token.endswith("구"):
            return token

    for token in tokens:
        if token.endswith(("시", "군")):
            return token

    return ""


# 시·도 이름 축약. "대전광역시" -> "대전"
_AREA_SHORT = {
    "서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구",
    "인천광역시": "인천", "광주광역시": "광주", "대전광역시": "대전",
    "울산광역시": "울산", "세종특별자치시": "세종", "경기도": "경기",
    "강원특별자치도": "강원", "충청북도": "충북", "충청남도": "충남",
    "전북특별자치도": "전북", "전라남도": "전남", "경상북도": "경북",
    "경상남도": "경남", "제주특별자치도": "제주",
}


# 관리자 병원 목록의 '지역' 칸과 지역 필터에 쓸 표기.
#
# 구만 쓰면 안 된다. 중구·동구·서구는 여러 시에 다 있어서(지금 데이터도 중구·동구가
# 대전과 대구에 겹친다) 어느 시의 구인지 구분이 안 되고, 지역 필터를 걸면 다른 시의
# 병원이 섞여 나온다. 그래서 시·도를 앞에 붙여 "대전 서구"처럼 만든다.
def _format_region(area: str, address: str) -> str:
    city = _AREA_SHORT.get(area, area)
    district = _extract_district(address)

    return f"{city} {district}" if district else city


# 관리자 병원관리 목록 조회
# 슈퍼관리자는 전체, 병원 소속 관리자는 자기 병원만 본다.
def get_hospital_list(
    db: Session,
    current_admin: Admin,
) -> list[AdminHospitalListItem]:

    rows = hospital_crud.list_all_with_stats(db)

    accessible_ids: set[int] | None = None

    if not admin_crud.is_super_admin(db=db, admin_id=current_admin.admin_id):
        accessible_ids = set(
            admin_crud.get_accessible_hospital_ids(db=db, admin_id=current_admin.admin_id)
        )

    return [
        AdminHospitalListItem(
            hospital_id=hospital.hospital_id,
            name=hospital.name,
            region=_format_region(hospital.area, hospital.address),
            beds=hospital.bed_count,
            devices=device_count,
            manager=manager_name or "-",
            active=hospital.is_active,
        )
        for hospital, device_count, manager_name in rows
        if accessible_ids is None or hospital.hospital_id in accessible_ids
    ]


# 관리자 이름 목록 조회 (병원 등록/수정 시 담당 관리자 배정용 - 슈퍼관리자 전용)
def get_admin_names(
    db: Session,
    current_admin: Admin,
) -> list[AdminNameResponse]:

    _require_super_admin(db=db, current_admin=current_admin)

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


# 관리자 병원 직접 추가 (슈퍼관리자 전용)
def create_hospital(
    db: Session,
    request: AdminHospitalCreateRequest,
    current_admin: Admin,
) -> AdminHospitalCreateResponse:

    _require_super_admin(db=db, current_admin=current_admin)

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
        hospital = hospital_crud.create(
            db=db,
            name=request.name,
            hospital_code=request.hospital_code,
            area=request.area,
            address=request.address,
            bed_count=request.bed_count,
        )

        # 관리자-병원 관계 생성
        admin_hospital_crud.create(
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


# 관리자 병원 상세 조회
def get_hospital_detail(
    db: Session,
    hospital_id: int,
    current_admin: Admin,
) -> AdminHospitalDetailResponse:

    _check_hospital_access(db=db, current_admin=current_admin, hospital_id=hospital_id)

    result = hospital_crud.get_detail_by_id(
        db=db,
        hospital_id=hospital_id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 병원입니다.",
        )

    hospital, admin = result

    manager = None

    if admin is not None:
        manager = AdminHospitalManagerResponse(
            admin_id=admin.admin_id,
            name=admin.name,
            email=admin.email,
            phone=admin.phone,
        )

    return AdminHospitalDetailResponse(
        hospital_id=hospital.hospital_id,
        name=hospital.name,
        hospital_code=hospital.hospital_code,
        area=hospital.area,
        address=hospital.address,
        bed_count=hospital.bed_count,
        is_active=hospital.is_active,
        created_at=hospital.created_at,
        manager=manager,
    )


# 관리자 병원별 병동 현황 조회
def get_hospital_wards(
    db: Session,
    hospital_id: int,
    current_admin: Admin,
) -> list[AdminHospitalWardResponse]:

    _check_hospital_access(db=db, current_admin=current_admin, hospital_id=hospital_id)

    rows = hospital_crud.get_wards_by_hospital_id(
        db=db,
        hospital_id=hospital_id,
    )

    return [
        AdminHospitalWardResponse(
            department_id=row.department_id,
            name=row.name,
            beds=row.bed_count,
            occupied=row.occupied,
            devices=row.devices,
        )
        for row in rows
    ]


# 관리자 병원별 연결 장치 현황 조회
def get_hospital_device_stats(
    db: Session,
    hospital_id: int,
    current_admin: Admin,
) -> AdminHospitalDeviceStatsResponse:

    _check_hospital_access(db=db, current_admin=current_admin, hospital_id=hospital_id)

    hospital = hospital_crud.get_by_id(
        db=db,
        hospital_id=hospital_id,
    )

    if hospital is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 병원입니다.",
        )

    rows = hospital_crud.get_device_stats_by_hospital_id(
        db=db,
        hospital_id=hospital_id,
    )

    stats = {
        DeviceStatus.ACTIVE: 0,
        DeviceStatus.OFFLINE: 0,
        DeviceStatus.ERROR: 0,
    }

    for row in rows:
        stats[row.status] = row.device_count

    return AdminHospitalDeviceStatsResponse(
        active=stats[DeviceStatus.ACTIVE],
        offline=stats[DeviceStatus.OFFLINE],
        error=stats[DeviceStatus.ERROR],
    )


# 관리자 병원 정보 수정 (담당 관리자 재배정까지 포함되어 있어 슈퍼관리자 전용)
def update_hospital(
    db: Session,
    hospital_id: int,
    request: AdminHospitalUpdateRequest,
    current_admin: Admin,
) -> AdminHospitalCreateResponse:

    _require_super_admin(db=db, current_admin=current_admin)

    # 병원 존재 여부 확인
    hospital = hospital_crud.get_by_id(
        db=db,
        hospital_id=hospital_id,
    )

    if hospital is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 병원입니다.",
        )

    # 관리자 존재 여부 확인
    admin = admin_crud.get_admin_by_id(
        db=db,
        admin_id=request.admin_id,
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

    if existing_hospital is not None and existing_hospital.hospital_id != hospital_id:
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

    if existing_hospital is not None and existing_hospital.hospital_id != hospital_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 등록된 병원입니다.",
        )

    try:
        # 병원 정보 수정
        hospital = hospital_crud.update(
            db=db,
            hospital=hospital,
            name=request.name,
            hospital_code=request.hospital_code,
            area=request.area,
            address=request.address,
            bed_count=request.bed_count,
        )

        # 기존 관리자-병원 관계 조회
        admin_hospital = admin_hospital_crud.get_by_hospital_id(
            db=db,
            hospital_id=hospital_id,
        )

        if admin_hospital is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="병원 관리자 연결 정보를 찾을 수 없습니다.",
            )

        # 담당 관리자 변경
        admin_hospital_crud.update_admin(
            db=db,
            admin_hospital=admin_hospital,
            admin_id=request.admin_id,
        )

        db.commit()

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

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


# 관리자 병원 활성/비활성 상태 변경
def update_hospital_status(
    db: Session,
    hospital_id: int,
    request: AdminHospitalStatusUpdateRequest,
    current_admin: Admin,
) -> AdminHospitalDetailResponse:

    _check_hospital_access(db=db, current_admin=current_admin, hospital_id=hospital_id)

    hospital = hospital_crud.get_by_id(
        db=db,
        hospital_id=hospital_id,
    )

    if hospital is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 병원입니다.",
        )

    hospital_crud.set_active(
        db=db,
        hospital=hospital,
        is_active=request.is_active,
    )

    db.commit()

    return get_hospital_detail(
        db=db,
        hospital_id=hospital_id,
        current_admin=current_admin,
    )


# 관리자 장치 목록 조회
def get_device_list(
    db: Session,
    current_admin: Admin,
    search: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 5,
) -> AdminDeviceListResponse:

    hospital_ids: list[int] | None = None

    if not admin_crud.is_super_admin(db=db, admin_id=current_admin.admin_id):
        hospital_ids = admin_crud.get_accessible_hospital_ids(
            db=db, admin_id=current_admin.admin_id
        )

    rows, total = device_crud.get_device_list(
        db=db,
        search=search,
        status=status,
        page=page,
        page_size=page_size,
        hospital_ids=hospital_ids,
    )

    items = [
        AdminDeviceListItem(
            device_id=row.device_id,
            serial_num=row.serial_num,
            hospital_name=row.hospital_name,
            ward=row.ward,
            room_num=row.room_num,
            bed_num=row.bed_num,
            status=row.status,
            updated_at=row.updated_at,
        )
        for row in rows
    ]

    return AdminDeviceListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


# 관리자 장치 상세 조회
def get_device_detail(
    db: Session,
    device_id: int,
    current_admin: Admin,
) -> AdminDeviceDetailResponse:

    row = device_crud.get_device_detail_by_serial_num(
        db=db,
        device_id=device_id,
    )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 장치입니다.",
        )

    _check_hospital_access(db=db, current_admin=current_admin, hospital_id=row.hospital_id)

    return AdminDeviceDetailResponse(
        serial_num=row.serial_num,
        status=row.status,
        ward=row.ward,
        room_num=row.room_num,
        bed_num=row.bed_num,
        hospital_id=row.hospital_id,
        hospital_name=row.hospital_name,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


# 관리자 장치 최신 생체 측정값 조회
def get_device_latest_vital(
    db: Session,
    device_id: int,
) -> AdminDeviceVitalResponse:

    row = vital_crud.get_latest_by_device_id(
        db=db,
        device_id=device_id,
    )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 장치입니다.",
        )

    # 환자 미배정(재고) 장치이거나, 아직 1분 평균이 한 번도 안 쌓였으면
    # avg_heart_rate 등이 전부 None이다 - 정상 상태이므로 그대로 내려준다.
    return AdminDeviceVitalResponse(
        status=row.status,
        heart_rate=row.avg_heart_rate,
        resp_rate=row.avg_resp_rate,
        recorded_at=row.recorded_at,
    )


# 관리자 장치 재고 등록 (환자 미배정)
# 장치 대수는 결제/과금과 직결되어 있어서, 병원 소속 관리자가 임의로
# 늘릴 수 없게 슈퍼관리자 전용으로 막는다.
def create_device(
    db: Session,
    request: AdminDeviceCreateRequest,
    current_admin: Admin,
) -> AdminDeviceCreateResponse:

    _require_super_admin(db=db, current_admin=current_admin)

    hospital = hospital_crud.get_by_id(
        db=db,
        hospital_id=request.hospital_id,
    )

    if hospital is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 병원입니다.",
        )

    existing_device = device_crud.get_by_serial_num(
        db=db,
        serial_num=request.serial_num,
    )

    if existing_device is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 등록된 시리얼 번호입니다.",
        )

    device = device_crud.create(
        db=db,
        hospital_id=request.hospital_id,
        serial_num=request.serial_num,
    )

    db.commit()
    db.refresh(device)

    return AdminDeviceCreateResponse(
        device_id=device.device_id,
        hospital_id=hospital.hospital_id,
        hospital_name=hospital.name,
        serial_num=device.serial_num,
        status=device.status.value,
        created_at=device.created_at,
    )


# 병원 소속 관리자 계정 발급 (슈퍼관리자 전용)
# 이 병원 하나에만 admin_hospitals로 묶여서, 이후 로그인하면 이 병원만 보인다.
def create_hospital_admin(
    db: Session,
    hospital_id: int,
    request: AdminHospitalAdminCreateRequest,
    current_admin: Admin,
) -> AdminHospitalAdminCreateResponse:

    _require_super_admin(db=db, current_admin=current_admin)

    hospital = hospital_crud.get_by_id(
        db=db,
        hospital_id=hospital_id,
    )

    if hospital is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 병원입니다.",
        )

    if exists_by_login_id(db=db, login_id=request.login_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 사용 중인 아이디입니다.",
        )

    if exists_by_email(db=db, email=request.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 사용 중인 이메일입니다.",
        )

    try:
        user = User(
            login_id=request.login_id,
            email=request.email,
            password=hash_password(request.password),
            role=UserRole.ADMIN,
        )

        create_user(db=db, user=user)

        admin = admin_crud.create_admin(
            db=db,
            user_id=user.user_id,
            name=request.name,
            email=request.email,
            phone=request.phone,
        )

        # 이 병원의 담당 관리자를 새 계정으로 교체한다. 병원 등록 때 지정자가
        # 없으면 admin_id=1(시스템 관리자)로 기본 연결돼 있는데, 그 자리를 그대로
        # 두고 새로 추가하면 한 병원에 담당 관리자가 둘로 겹친다.
        existing_link = admin_hospital_crud.get_by_hospital_id(
            db=db,
            hospital_id=hospital.hospital_id,
        )

        if existing_link is not None:
            admin_hospital_crud.update_admin(
                db=db,
                admin_hospital=existing_link,
                admin_id=admin.admin_id,
            )
        else:
            admin_hospital_crud.create(
                db=db,
                admin_id=admin.admin_id,
                hospital_id=hospital.hospital_id,
            )

        db.commit()
        db.refresh(admin)

    except Exception:
        db.rollback()
        raise

    return AdminHospitalAdminCreateResponse(
        admin_id=admin.admin_id,
        login_id=user.login_id,
        name=admin.name,
        email=admin.email,
        phone=admin.phone,
        hospital_id=hospital.hospital_id,
        hospital_name=hospital.name,
    )


# 권한관리 화면 - 전체 계정 목록 (슈퍼관리자 전용)
def list_users(
    db: Session,
    current_admin: Admin,
) -> list[AdminUserListItem]:

    _require_super_admin(db=db, current_admin=current_admin)

    items: list[AdminUserListItem] = []

    for row in user_crud.list_admin_rows(db=db):
        items.append(
            AdminUserListItem(
                user_id=row.user_id,
                login_id=row.login_id,
                name=row.name,
                email=row.email,
                role="ADMIN",
                hospital_name="전체" if row.is_super_admin else row.hospital_name,
                is_super_admin=row.is_super_admin,
                is_active=row.is_active,
                created_at=row.created_at,
            )
        )

    for row in user_crud.list_department_rows(db=db):
        items.append(
            AdminUserListItem(
                user_id=row.user_id,
                login_id=row.login_id,
                name=row.name,
                email=row.email,
                role="DEPARTMENT",
                hospital_name=row.hospital_name,
                is_super_admin=False,
                is_active=row.is_active,
                created_at=row.created_at,
            )
        )

    for row in user_crud.list_guardian_rows(db=db):
        items.append(
            AdminUserListItem(
                user_id=row.user_id,
                login_id=row.login_id,
                name=row.name,
                email=row.email,
                role="GUARDIAN",
                hospital_name=None,
                is_super_admin=False,
                is_active=row.is_active,
                created_at=row.created_at,
            )
        )

    items.sort(key=lambda item: item.created_at, reverse=True)

    return items


# 권한관리 화면 - 계정 활성/비활성 변경 (슈퍼관리자 전용)
def update_user_status(
    db: Session,
    user_id: int,
    request: AdminUserStatusUpdateRequest,
    current_admin: Admin,
) -> AdminUserListItem:

    _require_super_admin(db=db, current_admin=current_admin)

    if user_id == current_admin.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="자기 자신의 계정은 비활성화할 수 없습니다.",
        )

    user = user_crud.get_by_user_id(db=db, user_id=user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 사용자입니다.",
        )

    # 다른 슈퍼관리자라도 비활성화 대상에서 막는다 - 시스템 전체를 잠글 수 있는 계정이라
    # 화면에서도 이 계정 행은 아예 비활성화 버튼을 숨긴다.
    target_admin = admin_crud.get_admin_by_user_id(db=db, user_id=user_id)

    if target_admin is not None and target_admin.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="슈퍼관리자 계정은 비활성화할 수 없습니다.",
        )

    user_crud.set_active(db=db, user=user, is_active=request.is_active)

    db.commit()

    return next(item for item in list_users(db=db, current_admin=current_admin) if item.user_id == user_id)


def _to_system_settings_response(setting) -> AdminSystemSettingsResponse:
    return AdminSystemSettingsResponse(
        early_warning_enabled=setting.early_warning_enabled,
        danger_sustain_sec=setting.danger_sustain_sec,
        heart_rate_danger_low=setting.heart_rate_danger_low,
        heart_rate_danger_high=setting.heart_rate_danger_high,
        resp_rate_danger_low=setting.resp_rate_danger_low,
        resp_rate_danger_high=setting.resp_rate_danger_high,
    )


# 알림 관리 화면 - 시스템 설정 조회 (슈퍼관리자 전용)
def get_system_settings(
    db: Session,
    current_admin: Admin,
) -> AdminSystemSettingsResponse:

    _require_super_admin(db=db, current_admin=current_admin)

    setting = system_setting_crud.get_or_create(db=db)

    db.commit()

    return _to_system_settings_response(setting)


# 알림 관리 화면 - 시스템 설정 변경 (슈퍼관리자 전용)
def update_system_settings(
    db: Session,
    request: AdminSystemSettingsUpdateRequest,
    current_admin: Admin,
) -> AdminSystemSettingsResponse:

    _require_super_admin(db=db, current_admin=current_admin)

    setting = system_setting_crud.get_or_create(db=db)

    system_setting_crud.update(
        db=db,
        setting=setting,
        early_warning_enabled=request.early_warning_enabled,
        danger_sustain_sec=request.danger_sustain_sec,
        heart_rate_danger_low=request.heart_rate_danger_low,
        heart_rate_danger_high=request.heart_rate_danger_high,
        resp_rate_danger_low=request.resp_rate_danger_low,
        resp_rate_danger_high=request.resp_rate_danger_high,
    )

    db.commit()

    return _to_system_settings_response(setting)
