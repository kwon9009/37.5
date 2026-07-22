from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.dashboard.summary_response import DashboardSummaryResponse
from app.schemas.dashboard.patient_response import DashboardPatientResponse
from app.services import dashboard_service

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
)
def get_dashboard_summary(
    db: Session = Depends(get_db),
):
    return dashboard_service.get_dashboard_summary(db)


@router.get(
    "/patients",
    response_model=list[DashboardPatientResponse],
)
def get_dashboard_patients(
    db: Session = Depends(get_db),
):
    return dashboard_service.get_dashboard_patients(db)


@router.get(
    "/recent-alerts",
    response_model=list[DashboardAlertResponse],
)
def get_recent_alerts(
    db: Session = Depends(get_db),
):
    return dashboard_service.get_recent_alerts(db)
