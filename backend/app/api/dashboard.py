from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.dashboard.summary_response import DashboardSummaryResponse
from app.schemas.dashboard.patient_response import DashboardPatientResponse
from app.schemas.dashboard.alert_response import DashboardAlertResponse
from app.services import dashboard_service

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/summary")
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return dashboard_service.get_dashboard_summary(
        db=db,
        user_id=current_user.user_id,
    )


@router.get(
    "/patients",
    response_model=list[DashboardPatientResponse],
)
def get_dashboard_patients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return dashboard_service.get_dashboard_patients(
        db=db,
        user_id=current_user.user_id,
    )


@router.get(
    "/recent-alerts",
    response_model=list[DashboardAlertResponse],
)
def get_recent_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return dashboard_service.get_recent_alerts(
        db=db,
        user_id=current_user.user_id,
    )
