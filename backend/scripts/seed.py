from __future__ import annotations

from datetime import date
import random

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password

from app.models.enums import UserRole

from app.models.user import User
from app.models.hospital import Hospital
from app.models.department import Department
from app.models.guardian import Guardian
from app.models.patient import Patient
from app.models.patient_guardian import PatientGuardian
from app.models.device import Device
from app.models.vital_check import VitalCheck
from app.models.vital_log import VitalLog
from app.models.alert import Alert
from app.models.emergency_log import EmergencyLog
from app.models.admin import Admin
from app.models.admin_hospital import AdminHospital

from app.models.enums import (
    Gender,
    PatientStatus,
    DeviceStatus,
    VitalStatus,
)

# --------------------------------------------------
# Common
# --------------------------------------------------

DEFAULT_PASSWORD = "1234"


def pw():
    return hash_password(DEFAULT_PASSWORD)


def log(message: str):
    print(f"[OK] {message}")


def already_seeded(db: Session) -> bool:
    return db.query(User).first() is not None


# --------------------------------------------------
# Users
# --------------------------------------------------


def create_users(db: Session):

    users = []

    # ------------------------
    # Admin
    # ------------------------

    users.append(
        User(
            login_id="admin",
            email="admin@test.com",
            password=pw(),
            role=UserRole.ADMIN,
            is_active=True,
        )
    )

    # ------------------------
    # Department Users
    # ------------------------

    for i in range(1, 4):
        users.append(
            User(
                login_id=f"dept{i:02}",
                email=f"dept{i}@hospital.com",
                password=pw(),
                role=UserRole.DEPARTMENT,
                is_active=True,
            )
        )

    # ------------------------
    # Guardian Users
    # ------------------------

    for i in range(1, 6):
        users.append(
            User(
                login_id=f"guardian{i:02}",
                email=None,
                password=pw(),
                role=UserRole.GUARDIAN,
                is_active=True,
            )
        )

    db.add_all(users)
    db.commit()

    log("Users")


# --------------------------------------------------
# Admin
# --------------------------------------------------


def create_admins(db: Session):

    admin_user = db.query(User).filter(User.login_id == "admin").first()

    admin = Admin(
        user_id=admin_user.user_id,
        name="시스템 관리자",
        email="admin@test.com",
        phone="010-1111-1111",
    )

    db.add(admin)
    db.commit()

    log("Admins")


# --------------------------------------------------
# Admin Hospital
# --------------------------------------------------


def create_admin_hospitals(db: Session):

    admin = db.query(Admin).first()

    hospitals = db.query(Hospital).order_by(Hospital.hospital_id).all()

    mappings = [
        AdminHospital(
            admin_id=admin.admin_id,
            hospital_id=hospital.hospital_id,
        )
        for hospital in hospitals
    ]

    db.add_all(mappings)
    db.commit()

    log("Admin Hospitals")


# --------------------------------------------------
# Departments
# --------------------------------------------------


def create_departments(db: Session):

    users = (
        db.query(User)
        .filter(User.role == UserRole.DEPARTMENT)
        .order_by(User.user_id)
        .all()
    )

    hospitals = db.query(Hospital).order_by(Hospital.hospital_id).all()

    departments = [
        Department(
            user_id=users[0].user_id,
            hospital_id=hospitals[0].hospital_id,
            name="내과",
        ),
        Department(
            user_id=users[1].user_id,
            hospital_id=hospitals[0].hospital_id,
            name="외과",
        ),
        Department(
            user_id=users[2].user_id,
            hospital_id=hospitals[1].hospital_id,
            name="응급의학과",
        ),
    ]

    db.add_all(departments)
    db.commit()

    log("Departments")


# --------------------------------------------------
# Guardians
# --------------------------------------------------


def create_guardians(db: Session):

    users = (
        db.query(User)
        .filter(User.role == UserRole.GUARDIAN)
        .order_by(User.user_id)
        .all()
    )

    guardians = []

    for idx, user in enumerate(users, start=1):

        guardians.append(
            Guardian(
                user_id=user.user_id,
                name=f"보호자{idx}",
                phone=f"010-9000-{idx:04}",
            )
        )

    db.add_all(guardians)
    db.commit()

    log("Guardians")


# --------------------------------------------------
# Patients
# --------------------------------------------------


def create_patients(db: Session):

    departments = db.query(Department).order_by(Department.department_id).all()

    patient_names = [
        "김철수",
        "이영희",
        "박민수",
        "최지은",
        "정우성",
        "한지민",
        "유재석",
        "강호동",
        "신동엽",
        "아이유",
        "김연아",
        "손흥민",
        "장원영",
        "차은우",
        "백종원",
    ]

    patients = []

    for i in range(15):

        department = departments[i % len(departments)]

        patients.append(
            Patient(
                department_id=department.department_id,
                patient_no=f"P{i+1:04}",
                name=patient_names[i],
                birthdate=date(
                    random.randint(1940, 2010),
                    random.randint(1, 12),
                    random.randint(1, 28),
                ),
                gender=(Gender.MALE if i % 2 == 0 else Gender.FEMALE),
                ward=f"{(i % 3) + 1}병동",
                room_num=(i % 5) + 101,
                bed_num=(i % 4) + 1,
                special_notes="특이사항 없음",
                status=PatientStatus.ADMITTED,
                is_present=random.choice([True, True, True, False]),
                admission_date=date(2026, 7, random.randint(1, 20)),
                discharge_date=None,
            )
        )

    db.add_all(patients)
    db.commit()

    log("Patients")


# --------------------------------------------------
# Patient Guardian
# --------------------------------------------------


def create_patient_guardians(db: Session):

    guardians = db.query(Guardian).order_by(Guardian.guardian_id).all()

    patients = db.query(Patient).order_by(Patient.patient_id).all()

    relations = [
        "배우자",
        "아들",
        "딸",
        "형제",
        "보호자",
    ]

    mappings = []

    for i, patient in enumerate(patients):

        guardian = guardians[i % len(guardians)]

        mappings.append(
            PatientGuardian(
                patient_id=patient.patient_id,
                guardian_id=guardian.guardian_id,
                relation=relations[i % len(relations)],
            )
        )

    db.add_all(mappings)
    db.commit()

    log("Patient Guardians")


# --------------------------------------------------
# Devices
# --------------------------------------------------


def create_devices(db: Session):

    patients = db.query(Patient).order_by(Patient.patient_id).all()

    status_list = [
        DeviceStatus.ACTIVE,
        DeviceStatus.ACTIVE,
        DeviceStatus.ACTIVE,
        DeviceStatus.ACTIVE,
        DeviceStatus.ERROR,
        DeviceStatus.OFFLINE,
    ]

    devices = []

    for i, patient in enumerate(patients):

        devices.append(
            Device(
                patient_id=patient.patient_id,
                serial_num=f"DEV-{20260001+i}",
                status=status_list[i % len(status_list)],
            )
        )

    db.add_all(devices)
    db.commit()

    log("Devices")


# --------------------------------------------------
# Vital Checks
# --------------------------------------------------


def create_vital_checks(db: Session):

    patients = db.query(Patient).order_by(Patient.patient_id).all()

    status_cycle = [
        VitalStatus.NORMAL,
        VitalStatus.NORMAL,
        VitalStatus.NORMAL,
        VitalStatus.WARNING,
        VitalStatus.WARNING,
        VitalStatus.ALERT,
        VitalStatus.DANGER,
    ]

    vital_checks = []

    for i, patient in enumerate(patients):

        status = status_cycle[i % len(status_cycle)]

        if status == VitalStatus.NORMAL:
            heart_rate = random.randint(65, 85)
            resp_rate = random.randint(14, 18)

        elif status == VitalStatus.WARNING:
            heart_rate = random.randint(90, 105)
            resp_rate = random.randint(19, 22)

        elif status == VitalStatus.ALERT:
            heart_rate = random.randint(110, 130)
            resp_rate = random.randint(23, 28)

        else:
            heart_rate = random.randint(135, 160)
            resp_rate = random.randint(29, 36)

        vital_checks.append(
            VitalCheck(
                patient_id=patient.patient_id,
                heart_rate=heart_rate,
                resp_rate=resp_rate,
                status=status,
            )
        )

    db.add_all(vital_checks)
    db.commit()

    log("Vital Checks")


# --------------------------------------------------
# Alerts
# --------------------------------------------------


def create_alerts(db: Session):

    patients = db.query(Patient).order_by(Patient.patient_id).all()

    guardians = db.query(Guardian).order_by(Guardian.guardian_id).all()

    departments = db.query(Department).order_by(Department.department_id).all()

    messages = {
        VitalStatus.WARNING: "활력징후 주의가 감지되었습니다.",
        VitalStatus.ALERT: "의료진 확인이 필요합니다.",
        VitalStatus.DANGER: "응급상황이 감지되었습니다.",
    }

    alerts = []

    for i, patient in enumerate(patients):

        vital = (
            db.query(VitalCheck)
            .filter(VitalCheck.patient_id == patient.patient_id)
            .first()
        )

        if vital.status == VitalStatus.NORMAL:
            continue

        alerts.append(
            Alert(
                patient_id=patient.patient_id,
                department_id=patient.department_id,
                guardian_id=guardians[i % len(guardians)].guardian_id,
                message=messages[vital.status],
                is_read=random.choice([True, False]),
            )
        )

    db.add_all(alerts)
    db.commit()

    log("Alerts")


# --------------------------------------------------
# Vital Logs
# --------------------------------------------------


def create_vital_logs(db: Session):

    patients = db.query(Patient).order_by(Patient.patient_id).all()

    logs = []

    for patient in patients:

        vital = (
            db.query(VitalCheck)
            .filter(VitalCheck.patient_id == patient.patient_id)
            .first()
        )

        for _ in range(7):

            logs.append(
                VitalLog(
                    patient_id=patient.patient_id,
                    avg_heart_rate=max(
                        40,
                        vital.heart_rate + random.randint(-5, 5),
                    ),
                    avg_resp_rate=max(
                        8,
                        vital.resp_rate + random.randint(-2, 2),
                    ),
                )
            )

    db.add_all(logs)
    db.commit()

    log("Vital Logs")


# --------------------------------------------------
# Emergency Logs
# --------------------------------------------------


def create_emergency_logs(db: Session):

    danger_checks = (
        db.query(VitalCheck).filter(VitalCheck.status == VitalStatus.DANGER).all()
    )

    emergency_logs = []

    for vital in danger_checks:

        emergency_logs.append(
            EmergencyLog(
                patient_id=vital.patient_id,
                heart_rate=vital.heart_rate,
                resp_rate=vital.resp_rate,
                event_type="응급상황 감지",
            )
        )

    db.add_all(emergency_logs)
    db.commit()

    log("Emergency Logs")


# --------------------------------------------------
# Main
# --------------------------------------------------


def main():

    db = SessionLocal()

    try:

        if already_seeded(db):
            print("⚠️ 이미 Seed 데이터가 존재합니다.")
            return

        create_users(db)
        create_hospitals(db)
        create_admins(db)
        create_admin_hospitals(db)
        create_departments(db)
        create_guardians(db)
        create_patients(db)
        create_patient_guardians(db)
        create_devices(db)
        create_vital_checks(db)
        create_alerts(db)
        create_vital_logs(db)
        create_emergency_logs(db)

        print("\n==============================")
        print(" Seed Completed Successfully ")
        print("==============================")

    except Exception as e:

        db.rollback()
        print(f"\n❌ Seed Error : {e}")
        raise

    finally:

        db.close()


if __name__ == "__main__":
    main()
