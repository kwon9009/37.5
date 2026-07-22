from sqlalchemy.orm import Session

from app.crud import dashboard_crud
from app.schemas.dashboard.summary_response import DashboardSummaryResponse


def get_dashboard_summary(
    db: Session,
) -> DashboardSummaryResponse:
    summary = dashboard_crud.get_dashboard_summary(db)

    return DashboardSummaryResponse(**summary)
