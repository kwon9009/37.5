from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.models.vital_check import VitalCheck


def get_dashboard_summary(
    db: Session,
) -> dict:
    total_patients = db.query(Patient).count()

    status_counts = (
        db.query(
            VitalCheck.status,
            func.count(VitalCheck.vital_check_id),
        )
        .group_by(VitalCheck.status)
        .all()
    )

    status_map = {
        "NORMAL": 0,
        "WARNING": 0,
        "ALERT": 0,
        "DANGER": 0,
    }

    for status, count in status_counts:
        status_map[status] = count

    return {
        "total_patients": total_patients,
        "normal_count": status_map["NORMAL"],
        "warning_count": status_map["WARNING"],
        "alert_count": status_map["ALERT"],
        "danger_count": status_map["DANGER"],
    }
