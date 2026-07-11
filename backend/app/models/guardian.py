from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.patient_guardian import PatientGuardian
    from app.models.alert import Alert


class Guardian(BaseModel):
    __tablename__ = "guardians"

    guardian_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    login_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )

    password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    # Relationship
    patient_guardians: Mapped[list["PatientGuardian"]] = relationship(
        "PatientGuardian",
        back_populates="guardian",
        passive_deletes=True,
    )
    alerts: Mapped[list["Alert"]] = relationship(
        back_populates="guardian",
    )

    def __repr__(self) -> str:
        return f"Guardian(" f"guardian_id={self.guardian_id}, " f"name='{self.name}')"
