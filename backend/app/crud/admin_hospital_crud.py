from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.admin_hospital import AdminHospital


# 관리자와 병원 관계 생성
def create(
    db: Session,
    admin_id: int,
    hospital_id: int,
) -> AdminHospital:

    admin_hospital = AdminHospital(
        admin_id=admin_id,
        hospital_id=hospital_id,
    )

    db.add(admin_hospital)
    db.flush()

    return admin_hospital


# 병원에 연결된 관리자 관계 조회
def get_by_hospital_id(
    db: Session,
    hospital_id: int,
) -> AdminHospital | None:

    stmt = select(AdminHospital).where(
        AdminHospital.hospital_id == hospital_id,
    )

    return db.scalar(stmt)


# 병원 담당 관리자 변경
def update_admin(
    db: Session,
    admin_hospital: AdminHospital,
    admin_id: int,
) -> AdminHospital:

    admin_hospital.admin_id = admin_id

    db.flush()

    return admin_hospital
