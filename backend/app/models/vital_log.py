from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, BigInteger, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.patient import Patient


class VitalLog(Base):
    __tablename__ = "vital_logs"

    vital_log_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.patient_id", ondelete="CASCADE"),
        nullable=False,
    )

    avg_heart_rate: Mapped[int] = mapped_column(
        nullable=False,
    )

    avg_resp_rate: Mapped[int] = mapped_column(
        nullable=False,
    )

    recorded_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=func.now(),
    )

    # Relationship
    patient: Mapped[Patient] = relationship(
        back_populates="vital_logs",
    )

    def __repr__(self) -> str:
        return f"VitalLog(" f"vital_log_id={self.vital_log_id})"
