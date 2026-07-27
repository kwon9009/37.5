from sqlalchemy import update
from sqlalchemy.orm import Session

from app.models.alert import Alert


# 알림 읽음 처리
def read_alert(
    db: Session,
    alert_id: int,
):
    db.execute(update(Alert).where(Alert.alert_id == alert_id).values(is_read=True))

    db.commit()
