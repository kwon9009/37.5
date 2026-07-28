from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.department import Department


# 병원 내 동일한 진료과 존재 여부 확인
def exists_by_hospital_and_name(
    db: Session,
    hospital_id: int,
    department_name: str,
) -> bool:
    stmt = select(Department).where(
        Department.hospital_id == hospital_id,
        Department.name == department_name,
    )

    return db.scalar(stmt) is not None


# 진료과 생성
def create_department(
    db: Session,
    department: Department,
) -> Department:
    db.add(department)
    db.flush()

    return department


# User ID로 진료과 조회
def get_by_user_id(
    db: Session,
    user_id: int,
) -> Department | None:

    stmt = select(Department).where(Department.user_id == user_id)

    return db.scalar(stmt)
