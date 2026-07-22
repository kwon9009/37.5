from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.device import Device
from app.models.patient import Patient
from app.models.vital_check import VitalCheck
from app.models.alert import Alert


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


def get_dashboard_patients(
    db: Session,
) -> list[dict]:

    results = (
        db.query(
            Patient,
            VitalCheck,
            Device,
        )
        .join(
            VitalCheck,
            Patient.patient_id == VitalCheck.patient_id,
        )
        .join(
            Device,
            Patient.patient_id == Device.patient_id,
        )
        .all()
    )

    patients = []

    for patient, vital, device in results:

        patients.append(
            {
                "patient_id": patient.patient_id,
                "name": patient.name,
                "room": f"{patient.room_num}호 · B-{patient.bed_num}",
                "presence_label": patient.is_present,
                "severity": vital.status,
                "heart_rate": vital.heart_rate,
                "respiration_rate": vital.resp_rate,
                "sensor_status": device.status,
                "timestamp": vital.updated_at,
                "notes": patient.special_notes,
            }
        )

    return patients


def get_recent_alerts(db: Session) -> list[dict]:

    rows = (
        db.query(Alert, Patient)
        .join(Patient, Alert.patient_id == Patient.patient_id)
        .order_by(Alert.sent_at.desc())
        .limit(10)
        .all()
    )

    alerts = []

    for alert, patient in rows:
        alerts.append(
            {
                "alert_id": alert.alert_id,
                "patient_name": patient.name,
                "room": f"{patient.room_num}호 · B-{patient.bed_num}",
                "message": alert.message,
                "is_read": alert.is_read,
                "sent_at": alert.sent_at,
            }
        )

    return alerts
