from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.hospital import Hospital


# 병원명과 지역으로 병원 조회
def get_by_name_and_area(
    db: Session,
    name: str,
    area: str,
) -> Hospital | None:
    stmt = select(Hospital).where(
        Hospital.name == name,
        Hospital.area == area,
    )

    return db.scalar(stmt)
