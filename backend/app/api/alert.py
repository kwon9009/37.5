from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.common.message_response import MessageResponse
from app.services import alert_service

router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"],
)


# 알림 읽음 처리
@router.patch(
    "/{alert_id}/read",
    response_model=MessageResponse,
)
def read_alert(
    alert_id: int,
    db: Session = Depends(get_db),
):
    return alert_service.read_alert(
        db=db,
        alert_id=alert_id,
    )
