from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.device import Device
from app.models.enums import DeviceStatus
from app.models.hospital import Hospital
from app.models.patient import Patient


# 관리자 장치 목록 조회
# 장치는 hospital_id로 항상 병원에 속하지만, 환자 배정(patient_id)은 없을 수 있다.
# 그래서 병원은 inner join, 환자/부서는 outer join으로 미배정 장치도 목록에 나오게 한다.
def get_device_list(
    db: Session,
    search: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 5,
    hospital_ids: list[int] | None = None,
):
    def apply_filters(stmt):
        if search:
            keyword = search.strip()

            conditions = [
                Device.serial_num.ilike(f"%{keyword}%"),
                Hospital.name.ilike(f"%{keyword}%"),
                Patient.ward.ilike(f"%{keyword}%"),
            ]

            if keyword.isdigit():
                conditions.append(Patient.room_num == int(keyword))

            stmt = stmt.where(or_(*conditions))

        if status:
            stmt = stmt.where(Device.status == status)

        # hospital_ids가 None이면 슈퍼관리자(전체 허용). 빈 리스트는 접근 가능한
        # 병원이 하나도 없다는 뜻이라 결과도 0건이어야 한다.
        if hospital_ids is not None:
            stmt = stmt.where(Device.hospital_id.in_(hospital_ids))

        return stmt

    stmt = apply_filters(
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
            Hospital,
            Device.hospital_id == Hospital.hospital_id,
        )
        .outerjoin(
            Patient,
            Device.patient_id == Patient.patient_id,
        )
    )

    stmt = (
        stmt.order_by(Device.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    rows = db.execute(stmt).all()

    # 전체 장치 수 조회
    count_stmt = apply_filters(
        select(func.count(Device.device_id))
        .select_from(Device)
        .join(
            Hospital,
            Device.hospital_id == Hospital.hospital_id,
        )
        .outerjoin(
            Patient,
            Device.patient_id == Patient.patient_id,
        )
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
            Hospital,
            Device.hospital_id == Hospital.hospital_id,
        )
        .outerjoin(
            Patient,
            Device.patient_id == Patient.patient_id,
        )
        .where(
            Device.device_id == device_id,
        )
    )

    return db.execute(stmt).first()


# 시리얼 번호로 장치 조회 (중복 등록 확인용)
def get_by_serial_num(
    db: Session,
    serial_num: str,
) -> Device | None:
    stmt = select(Device).where(Device.serial_num == serial_num)

    return db.scalar(stmt)


# 장치 재고 등록 (환자 미배정)
def create(
    db: Session,
    hospital_id: int,
    serial_num: str,
) -> Device:
    device = Device(
        hospital_id=hospital_id,
        patient_id=None,
        serial_num=serial_num,
        status=DeviceStatus.OFFLINE,
    )

    db.add(device)
    db.flush()

    return device
