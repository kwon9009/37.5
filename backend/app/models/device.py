from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import DeviceStatus

if TYPE_CHECKING:
    from app.models.patient import Patient


class Device(BaseModel):
    __tablename__ = "devices"

    device_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    # 장치는 항상 어느 병원 소속인지가 정해진다(재고 등록 시점부터).
    # 환자 배정은 그 다음 단계라 patient_id와 분리했다.
    hospital_id: Mapped[int] = mapped_column(
        ForeignKey("hospitals.hospital_id", ondelete="CASCADE"),
        nullable=False,
    )

    # 관리자가 재고로 등록만 하고, 병원(부서)이 환자를 받을 때 배정하는 흐름을 지원하려면
    # 배정 전 상태(NULL)가 있어야 한다. 환자가 퇴원/삭제되면 장치는 없어지지 않고
    # 미배정 상태로 돌아간다(SET NULL).
    patient_id: Mapped[int | None] = mapped_column(
        ForeignKey("patients.patient_id", ondelete="SET NULL"),
        nullable=True,
    )

    status: Mapped[DeviceStatus] = mapped_column(
        Enum(DeviceStatus),
        nullable=False,
    )

    serial_num: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
    )

    # Relationship
    patient: Mapped[Patient | None] = relationship(
        back_populates="devices",
    )

    def __repr__(self) -> str:
        return (
            f"Device("
            f"device_id={self.device_id}, "
            f"serial_num='{self.serial_num}')"
        )
