from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.guardian import Guardian
    from app.models.patient import Patient


class PatientGuardian(Base):
    __tablename__ = "patient_guardians"

    patient_guardian_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.patient_id"),
        nullable=False,
    )

    guardian_id: Mapped[int] = mapped_column(
        ForeignKey("guardians.guardian_id"),
        nullable=False,
    )

    relationship: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    # Relationship
    guardian: Mapped["Guardian"] = relationship(
        "Guardian",
        back_populates="patient_guardians",
    )

    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="patient_guardians",
    )

    def __repr__(self) -> str:
        return f"PatientGuardian(" f"patient_guardian_id={self.patient_guardian_id})"
