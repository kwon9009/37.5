from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.device import Device
from app.models.hospital import Hospital
from app.models.patient import Patient


# 관리자 장치 목록 조회
def get_device_list(
    db: Session,
    search: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 5,
):
    stmt = (
        select(
            Device.device_id,
            Device.serial_num,
            Hospital.name.label("hospital_name"),
            Patient.ward,
            Patient.room_num,
            Patient.bed_num,
            Device.status,
            Device.updated_at,
        )
        .select_from(Device)
        .join(
            Patient,
            Device.patient_id == Patient.patient_id,
        )
        .join(
            Department,
            Patient.department_id == Department.department_id,
        )
        .join(
            Hospital,
            Department.hospital_id == Hospital.hospital_id,
        )
    )

    # 장치 ID, 병원명, 병동 또는 병실 검색
    if search:
        search = search.strip()

        conditions = [
            Device.serial_num.ilike(f"%{search}%"),
            Hospital.name.ilike(f"%{search}%"),
            Patient.ward.ilike(f"%{search}%"),
        ]

        if search.isdigit():
            conditions.append(Patient.room_num == int(search))

        stmt = stmt.where(or_(*conditions))

    # 장치 상태 필터
    if status:
        stmt = stmt.where(
            Device.status == status,
        )

    stmt = (
        stmt.order_by(Device.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    rows = db.execute(stmt).all()

    # 전체 장치 수 조회
    count_stmt = (
        select(func.count(Device.device_id))
        .select_from(Device)
        .join(
            Patient,
            Device.patient_id == Patient.patient_id,
        )
    )

    if search:
        search = search.strip()

        count_conditions = [
            Device.serial_num.ilike(f"%{search}%"),
            Hospital.name.ilike(f"%{search}%"),
            Patient.ward.ilike(f"%{search}%"),
        ]

        if search.isdigit():
            count_conditions.append(Patient.room_num == int(search))

        count_stmt = count_stmt.where(or_(*count_conditions))

    if status:
        count_stmt = count_stmt.where(
            Device.status == status,
        )

    total = db.scalar(count_stmt) or 0

    return rows, total


# 관리자 장치 상세 조회
def get_device_detail_by_serial_num(
    db: Session,
    device_id: int,
):
    stmt = (
        select(
            Device.serial_num,
            Device.status,
            Patient.ward,
            Patient.room_num,
            Patient.bed_num,
            Hospital.hospital_id,
            Hospital.name.label("hospital_name"),
            Device.created_at,
            Device.updated_at,
        )
        .select_from(Device)
        .join(
            Patient,
            Device.patient_id == Patient.patient_id,
        )
        .join(
            Department,
            Patient.department_id == Department.department_id,
        )
        .join(
            Hospital,
            Department.hospital_id == Hospital.hospital_id,
        )
        .where(
            Device.device_id == device_id,
        )
    )

    return db.execute(stmt).first()
