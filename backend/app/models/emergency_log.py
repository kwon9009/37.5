from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, TIMESTAMP, func, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.patient import Patient


class EmergencyLog(Base):
    __tablename__ = "emergency_logs"

    emergency_log_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.patient_id"),
        nullable=False,
    )

    heart_rate: Mapped[int] = mapped_column(
        nullable=False,
    )

    resp_rate: Mapped[int] = mapped_column(
        nullable=False,
    )

    event_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=func.now(),
    )

    # Relationship
    patient: Mapped[Patient] = relationship(
        back_populates="emergency_logs",
    )

    def __repr__(self) -> str:
        return (
            f"EmergencyLog("
            f"emergency_log_id={self.emergency_log_id}, "
            f"event_type='{self.event_type}')"
        )
