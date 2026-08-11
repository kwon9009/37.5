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
