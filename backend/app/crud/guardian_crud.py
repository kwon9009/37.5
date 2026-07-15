from sqlalchemy.orm import Session

from app.models.guardian import Guardian


# 보호자 생성
def create_guardian(
    db: Session,
    guardian: Guardian,
) -> Guardian:
    db.add(guardian)
    db.flush()

    return guardian
