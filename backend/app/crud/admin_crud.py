from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.admin import Admin


# 관리자 목록 조회
def get_admin_names(
    db: Session,
) -> list[Admin]:
    stmt = select(Admin).order_by(Admin.admin_id)

    return list(db.scalars(stmt))
