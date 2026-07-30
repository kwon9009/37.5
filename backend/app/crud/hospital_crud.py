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


# 병원명으로 검색 (회원가입 시 소속 병원 검색용)
def search_by_name(
    db: Session,
    query: str,
) -> list[Hospital]:
    stmt = (
        select(Hospital)
        .where(Hospital.name.ilike(f"%{query}%"))
        .order_by(Hospital.name)
        .limit(20)
    )

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
