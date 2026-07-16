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
