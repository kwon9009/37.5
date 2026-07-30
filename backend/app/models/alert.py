from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    ForeignKey,
    String,
    TIMESTAMP,
    func,
    BigInteger,
    text,
    Enum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import VitalStatus

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.guardian import Guardian
    from app.models.patient import Patient


class Alert(Base):
    __tablename__ = "alerts"

    alert_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.patient_id", ondelete="CASCADE"),
        nullable=False,
    )

    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.department_id", ondelete="SET NULL"),
        nullable=True,
    )

    guardian_id: Mapped[int | None] = mapped_column(
        ForeignKey("guardians.guardian_id", ondelete="SET NULL"),
        nullable=True,
    )

    message: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    status: Mapped[VitalStatus] = mapped_column(
        Enum(VitalStatus),
        nullable=False,
    )

    # 바꾸기
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("0"),
    )

    sent_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        server_default=func.now(),
    )

    # Relationship
    patient: Mapped[Patient] = relationship(
        back_populates="alerts",
    )

    department: Mapped[Department | None] = relationship(
        back_populates="alerts",
    )

    guardian: Mapped[Guardian | None] = relationship(
        back_populates="alerts",
    )

    def __repr__(self) -> str:
        return (
            f"Alert("
            f"alert_id={self.alert_id}, "
            f"is_read={self.is_read}), "
            f"status={self.status})"
        )
