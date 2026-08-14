from sqlalchemy import func, select, case
from sqlalchemy.orm import Session

from app.models.admin import Admin
from app.models.admin_hospital import AdminHospital
from app.models.department import Department
from app.models.device import Device
from app.models.hospital import Hospital
from app.models.patient import Patient


# 병원명과 주소로 병원 조회
def get_by_name_and_address(
    db: Session,
    name: str,
    address: str,
) -> Hospital | None:
    stmt = select(Hospital).where(
        Hospital.name == name,
        Hospital.address == address,
    )

    return db.scalar(stmt)


# ID로 병원 조회
def get_by_id(
    db: Session,
    hospital_id: int,
) -> Hospital | None:
    return db.get(Hospital, hospital_id)


# 병원명/지역으로 검색 (회원가입 시 소속 병원 검색용)
# 둘 다 선택 사항이다. 지역만 주면 그 지역 병원을 쭉 보여주고,
# 이름만 주면 예전처럼 이름으로 찾고, 둘 다 주면 지역 안에서 이름으로 좁힌다.
def search_by_name(
    db: Session,
    query: str | None = None,
    area: str | None = None,
    limit: int = 20,
) -> list[Hospital]:
    stmt = select(Hospital)

    if query:
        stmt = stmt.where(Hospital.name.ilike(f"%{query}%"))

    if area:
        stmt = stmt.where(Hospital.area == area)

    stmt = stmt.order_by(Hospital.name).limit(limit)

    return list(db.scalars(stmt))


# 병원 코드로 조회 (보호자가 문자로 받은 코드를 입력했을 때)
# 코드는 대소문자를 가리지 않는다. 문자로 받은 코드를 손으로 옮겨 적다가
# 소문자로 입력하는 일이 잦은데, 그때마다 "없는 병원"이 되면 안 된다.
def get_by_code(
    db: Session,
    hospital_code: str,
) -> Hospital | None:

    stmt = select(Hospital).where(
        func.upper(Hospital.hospital_code) == hospital_code.strip().upper()
    )

    return db.scalar(stmt)


# 등록된 병원이 있는 지역 목록 (회원가입 화면의 지역 선택 칸에 채운다)
def list_areas(db: Session) -> list[str]:
    stmt = select(Hospital.area).distinct().order_by(Hospital.area)

    return list(db.scalars(stmt))


# 관리자 병원관리 목록 (병상수/연결 장치 수/담당 관리자까지 조인)
def list_all_with_stats(db: Session):
    # Device.hospital_id로 직접 센다 - 환자 미배정(재고) 장치도 포함되어야 한다.
    device_count_subq = (
        select(
            Device.hospital_id.label("hospital_id"),
            func.count(Device.device_id).label("device_count"),
        )
        .select_from(Device)
        .group_by(Device.hospital_id)
        .subquery()
    )

    manager_subq = (
        select(
            AdminHospital.hospital_id.label("hospital_id"),
            func.min(Admin.name).label("manager_name"),
        )
        .select_from(AdminHospital)
        .join(Admin, AdminHospital.admin_id == Admin.admin_id)
        .group_by(AdminHospital.hospital_id)
        .subquery()
    )

    stmt = (
        select(
            Hospital,
            func.coalesce(device_count_subq.c.device_count, 0).label("device_count"),
            manager_subq.c.manager_name,
        )
        .outerjoin(
            device_count_subq, device_count_subq.c.hospital_id == Hospital.hospital_id
        )
        .outerjoin(manager_subq, manager_subq.c.hospital_id == Hospital.hospital_id)
        .order_by(Hospital.hospital_id)
    )

    return db.execute(stmt).all()


# 병원 생성
def create(
    db: Session,
    name: str,
    hospital_code: str,
    area: str,
    address: str,
    bed_count: int,
) -> Hospital:

    hospital = Hospital(
        name=name,
        hospital_code=hospital_code,
        area=area,
        address=address,
        bed_count=bed_count,
    )

    db.add(hospital)
    db.flush()

    return hospital


# 관리자 병원 상세 조회
def get_detail_by_id(
    db: Session,
    hospital_id: int,
):
    stmt = (
        select(
            Hospital,
            Admin,
        )
        .outerjoin(
            AdminHospital,
            AdminHospital.hospital_id == Hospital.hospital_id,
        )
        .outerjoin(
            Admin,
            Admin.admin_id == AdminHospital.admin_id,
        )
        .where(
            Hospital.hospital_id == hospital_id,
        )
    )

    return db.execute(stmt).first()


# 관리자 병원별 병동 현황 조회
# 병동별 정원(병상 수)을 별도로 관리하는 컬럼이 없어서,
# 그 병동 환자들이 쓰는 room_num의 종류 수를 병상 수로 취급한다.
# (환자가 배정된 적 없는 빈 방은 집계에서 빠진다)
def get_wards_by_hospital_id(
    db: Session,
    hospital_id: int,
):
    stmt = (
        select(
            Department.department_id,
            Department.name,
            func.count(func.distinct(Patient.room_num)).label("bed_count"),
            func.count(
                func.distinct(
                    case(
                        (Patient.is_present.is_(True), Patient.patient_id),
                    )
                )
            ).label("occupied"),
            func.count(Device.device_id).label("devices"),
        )
        .select_from(Department)
        .outerjoin(
            Patient,
            Patient.department_id == Department.department_id,
        )
        .outerjoin(
            Device,
            Device.patient_id == Patient.patient_id,
        )
        .where(
            Department.hospital_id == hospital_id,
        )
        .group_by(
            Department.department_id,
            Department.name,
        )
        .order_by(
            Department.department_id,
        )
    )

    return db.execute(stmt).all()


# 관리자 병원별 연결 장치 현황 조회
# Device.hospital_id로 직접 필터링한다 - 환자 미배정(재고) 장치도 병원 소속이므로
# 여기 포함되어야 한다(환자를 거쳐서 병원을 찾으면 미배정 장치가 빠진다).
def get_device_stats_by_hospital_id(
    db: Session,
    hospital_id: int,
):
    stmt = (
        select(
            Device.status,
            func.count(Device.device_id).label("device_count"),
        )
        .select_from(Device)
        .where(
            Device.hospital_id == hospital_id,
        )
        .group_by(
            Device.status,
        )
    )

    return db.execute(stmt).all()


# 병원 정보 수정
def update(
    db: Session,
    hospital: Hospital,
    name: str,
    hospital_code: str,
    area: str,
    address: str,
    bed_count: int,
) -> Hospital:

    hospital.name = name
    hospital.hospital_code = hospital_code
    hospital.area = area
    hospital.address = address
    hospital.bed_count = bed_count

    db.flush()

    return hospital


# 병원 활성/비활성 상태 변경
def set_active(
    db: Session,
    hospital: Hospital,
    is_active: bool,
) -> Hospital:

    hospital.is_active = is_active

    db.flush()

    return hospital
