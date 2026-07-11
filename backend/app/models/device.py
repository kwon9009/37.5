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

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.patient_id"),
        nullable=False,
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
    patient: Mapped[Patient] = relationship(
        back_populates="devices",
    )

    def __repr__(self) -> str:
        return (
            f"Device("
            f"device_id={self.device_id}, "
            f"serial_num='{self.serial_num}')"
        )
