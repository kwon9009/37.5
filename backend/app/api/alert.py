from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.common.message_response import MessageResponse
from app.schemas.alert.alert_list_response import AlertListResponse
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return alert_service.read_alert(
        db=db,
        user_id=current_user.user_id,
        alert_id=alert_id,
    )


# 알림 목록 조회
@router.get(
    "",
    response_model=AlertListResponse,
)
def get_alerts(
    is_read: bool | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return alert_service.get_alerts(
        db=db,
        user_id=current_user.user_id,
        is_read=is_read,
    )


# 모든 알림 읽음 처리
@router.patch(
    "/read-all",
    response_model=MessageResponse,
)
def read_all_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return alert_service.read_all_alerts(
        db=db,
        user_id=current_user.user_id,
    )
