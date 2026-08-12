import re

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud import (
    admin_crud,
    hospital_crud,
    admin_hospital_crud,
    device_crud,
    vital_crud,
)
from app.models.enums import DeviceStatus
from app.schemas.admin.hospital_list_response import AdminHospitalListItem
from app.schemas.admin.admin_name_response import AdminNameResponse
from app.schemas.admin.admin_hospital_create_request import AdminHospitalCreateRequest
from app.schemas.admin.admin_hospital_create_response import AdminHospitalCreateResponse
from app.schemas.admin.hospital_ward_response import AdminHospitalWardResponse
from app.schemas.admin.hospital_update_request import AdminHospitalUpdateRequest
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
def get_hospital_list(
    db: Session,
) -> list[AdminHospitalListItem]:

    rows = hospital_crud.list_all_with_stats(db)

    return [
        AdminHospitalListItem(
            hospital_id=hospital.hospital_id,
            name=hospital.name,
            region=_format_region(hospital.area, hospital.address),
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
) -> AdminHospitalDetailResponse:

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
        created_at=hospital.created_at,
        manager=manager,
    )


# 관리자 병원별 병동 현황 조회
def get_hospital_wards(
    db: Session,
    hospital_id: int,
) -> list[AdminHospitalWardResponse]:

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
) -> AdminHospitalDeviceStatsResponse:

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


# 관리자 병원 정보 수정
def update_hospital(
    db: Session,
    hospital_id: int,
    request: AdminHospitalUpdateRequest,
) -> AdminHospitalCreateResponse:

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


# 관리자 장치 목록 조회
def get_device_list(
    db: Session,
    search: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 5,
) -> AdminDeviceListResponse:

    rows, total = device_crud.get_device_list(
        db=db,
        search=search,
        status=status,
        page=page,
        page_size=page_size,
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

    return AdminDeviceVitalResponse(
        status=row.status,
        heart_rate=row.avg_heart_rate,
        resp_rate=row.avg_resp_rate,
        recorded_at=row.recorded_at,
    )
