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

    # 장치는 재고로 등록되는 시점부터 병원 소속이 정해진다(환자 배정과는 별개).
    hospital_id: Mapped[int] = mapped_column(
        ForeignKey("hospitals.hospital_id", ondelete="CASCADE"),
        nullable=False,
    )

    # 관리자가 재고만 등록해 두고 병원이 나중에 환자에게 배정하므로 비어 있을 수 있다.
    # 환자가 삭제돼도 장치는 재고로 남아야 해서 SET NULL 이다.
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
    patient: Mapped["Patient | None"] = relationship(
        back_populates="devices",
    )

    def __repr__(self) -> str:
        return (
            f"Device("
            f"device_id={self.device_id}, "
            f"serial_num='{self.serial_num}')"
        )
