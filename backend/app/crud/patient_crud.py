from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.department import Department
from app.models.device import Device
from app.models.emergency_log import EmergencyLog
from app.models.guardian import Guardian
from app.models.hospital import Hospital
from app.models.patient import Patient
from app.models.patient_guardian import PatientGuardian
from app.models.vital_check import VitalCheck
from app.models.vital_log import VitalLog


# 환자 상세 조회
def get_patient_detail(
    db: Session,
    patient_id: int,
):

    row = (
        db.query(
            Patient,
            Department,
            Hospital,
            Device,
            VitalCheck,
            Guardian,
        )
        .join(
            Department,
            Patient.department_id == Department.department_id,
        )
        .join(
            Hospital,
            Department.hospital_id == Hospital.hospital_id,
        )
        .outerjoin(
            Device,
            Device.patient_id == Patient.patient_id,
        )
        .outerjoin(
            VitalCheck,
            VitalCheck.patient_id == Patient.patient_id,
        )
        .outerjoin(
            PatientGuardian,
            Patient.patient_id == PatientGuardian.patient_id,
        )
        .outerjoin(
            Guardian,
            Guardian.guardian_id == PatientGuardian.guardian_id,
        )
        .filter(Patient.patient_id == patient_id)
        .first()
    )

    if row is None:
        return None

    (
        patient,
        department,
        hospital,
        device,
        vital_check,
        guardian,
    ) = row

    return {
        "patient": patient,
        "department": department,
        "hospital": hospital,
        "device": device,
        "vital_check": vital_check,
        "guardian": guardian,
    }


# 환자 Vital Log 조회
def get_patient_vital_logs(
    db: Session,
    patient_id: int,
):

    rows = (
        db.query(VitalLog)
        .filter(VitalLog.patient_id == patient_id)
        .order_by(VitalLog.recorded_at.desc())
        .all()
    )

    return rows


# 환자 Alert 조회
def get_patient_alerts(
    db: Session,
    patient_id: int,
):

    rows = (
        db.query(Alert)
        .filter(Alert.patient_id == patient_id)
        .order_by(Alert.sent_at.desc())
        .all()
    )

    return rows


# 환자 Emergency Log 조회
def get_patient_emergency_logs(
    db: Session,
    patient_id: int,
):

    rows = (
        db.query(EmergencyLog)
        .filter(EmergencyLog.patient_id == patient_id)
        .order_by(EmergencyLog.occurred_at.desc())
        .all()
    )

    return rows
