from sqlalchemy import func, select
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
) -> list[Hospital]:
    stmt = select(Hospital)

    if query:
        stmt = stmt.where(Hospital.name.ilike(f"%{query}%"))

    if area:
        stmt = stmt.where(Hospital.area == area)

    stmt = stmt.order_by(Hospital.name).limit(20)

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
    device_count_subq = (
        select(
            Department.hospital_id.label("hospital_id"),
            func.count(Device.device_id).label("device_count"),
        )
        .select_from(Device)
        .join(Patient, Device.patient_id == Patient.patient_id)
        .join(Department, Patient.department_id == Department.department_id)
        .group_by(Department.hospital_id)
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
        .outerjoin(device_count_subq, device_count_subq.c.hospital_id == Hospital.hospital_id)
        .outerjoin(manager_subq, manager_subq.c.hospital_id == Hospital.hospital_id)
        .order_by(Hospital.hospital_id)
    )

    return db.execute(stmt).all()
