from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.device import Device
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
            Device.serial_num,
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
    )

    # 장치 ID 또는 병실 검색
    if search:
        search = search.strip()

        stmt = stmt.where(
            or_(
                Device.serial_num.ilike(f"%{search}%"),
                Patient.ward.ilike(f"%{search}%"),
                Patient.room_num == int(search) if search.isdigit() else False,
            )
        )

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
        count_conditions = [
            Device.serial_num.ilike(f"%{search}%"),
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
