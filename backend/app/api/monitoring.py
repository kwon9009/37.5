from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.monitoring.monitoring_response import (
    RealtimeMonitoringResponse,
)
from app.services import monitoring_service

router = APIRouter(
    prefix="/monitoring",
    tags=["Monitoring"],
)


# 실시간 모니터링 조회
@router.get(
    "",
    response_model=RealtimeMonitoringResponse,
)
def get_realtime_monitoring(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    return monitoring_service.get_realtime_monitoring(
        db=db,
        user_id=current_user.user_id,
    )
