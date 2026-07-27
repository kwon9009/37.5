from sqlalchemy.orm import Session

from app.crud import alert_crud
from app.schemas.common.message_response import MessageResponse


# 알림 읽음 처리
def read_alert(
    db: Session,
    alert_id: int,
):
    alert_crud.read_alert(
        db=db,
        alert_id=alert_id,
    )

    return MessageResponse(message="알림을 읽음 처리했습니다.")
