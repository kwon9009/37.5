from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.device import Device
from app.models.patient import Patient
from app.models.vital_check import VitalCheck


# 병동 목록 조회
def get_wards(
    db: Session,
    department_id: int,
):

    rows = (
        db.query(
            Patient.ward,
            func.count(Patient.patient_id),
        )
        .filter(
            Patient.department_id == department_id,
        )
        .group_by(
            Patient.ward,
        )
        .order_by(
            Patient.ward,
        )
        .all()
    )

    return rows


# 실시간 모니터링 조회
def get_realtime_patients(
    db: Session,
    department_id: int,
):

    rows = (
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
        .filter(
            Patient.department_id == department_id,
        )
        .order_by(
            Patient.room_num,
            Patient.bed_num,
        )
        .all()
    )

    return rows
