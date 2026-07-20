from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, BigInteger, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.guardian import Guardian
    from app.models.patient import Patient


class PatientGuardian(Base):
    __tablename__ = "patient_guardians"
    __table_args__ = (
        UniqueConstraint("patient_id", "guardian_id", name="uk_patient_guardian"),
    )

    patient_guardian_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.patient_id", ondelete="CASCADE"),
        nullable=False,
    )

    guardian_id: Mapped[int] = mapped_column(
        ForeignKey("guardians.guardian_id", ondelete="CASCADE"),
        nullable=False,
    )

    relation: Mapped[str] = mapped_column(
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
