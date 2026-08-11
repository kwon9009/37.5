from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.admin import Admin
from app.models.admin_hospital import AdminHospital
from app.models.hospital import Hospital


# 관리자 목록 조회
def get_admin_names(
    db: Session,
) -> list[Admin]:
    stmt = select(Admin).order_by(Admin.admin_id)

    return list(db.scalars(stmt))


# 관리자 ID로 조회
def get_admin_by_id(
    db: Session,
    admin_id: int,
) -> Admin | None:
    return db.get(Admin, admin_id)


# 병원 생성
def create_hospital(
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


# 관리자와 병원 관계 생성
def create_admin_hospital(
    db: Session,
    admin_id: int,
    hospital_id: int,
) -> AdminHospital:

    admin_hospital = AdminHospital(
        admin_id=admin_id,
        hospital_id=hospital_id,
    )

    db.add(admin_hospital)

    return admin_hospital
