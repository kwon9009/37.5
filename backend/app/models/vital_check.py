from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import VitalStatus

if TYPE_CHECKING:
    from app.models.patient import Patient


class VitalCheck(BaseModel):
    __tablename__ = "vital_checks"

    vital_check_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.patient_id", ondelete="CASCADE"),
        nullable=False,
    )

    heart_rate: Mapped[int] = mapped_column(
        nullable=False,
    )

    resp_rate: Mapped[int] = mapped_column(
        nullable=False,
    )

    status: Mapped[VitalStatus] = mapped_column(
        Enum(VitalStatus),
        nullable=False,
    )

    # Relationship
    patient: Mapped[Patient] = relationship(
        back_populates="vital_checks",
    )

    def __repr__(self) -> str:
        return (
            f"VitalCheck("
            f"vital_check_id={self.vital_check_id}, "
            f"status={self.status})"
        )
