from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    Date,
    Enum,
    ForeignKey,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import PatientLinkRequestStatus

if TYPE_CHECKING:
    from app.models.guardian import Guardian
    from app.models.hospital import Hospital


class PatientLinkRequest(BaseModel):
    __tablename__ = "patient_link_requests"

    __table_args__ = (
        UniqueConstraint(
            "guardian_id",
            "hospital_id",
            "patient_name",
            "birthdate",
            name="uk_patient_link_request",
        ),
    )

    request_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    guardian_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("guardians.guardian_id"),
        nullable=False,
    )

    hospital_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("hospitals.hospital_id"),
        nullable=False,
    )

    patient_name: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    birthdate: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    relation: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    status: Mapped[PatientLinkRequestStatus] = mapped_column(
        Enum(PatientLinkRequestStatus),
        nullable=False,
        default=PatientLinkRequestStatus.PENDING,
    )

    # Relationship
    guardian: Mapped["Guardian"] = relationship(
        "Guardian",
        back_populates="patient_link_requests",
    )

    hospital: Mapped["Hospital"] = relationship(
        "Hospital",
        back_populates="patient_link_requests",
    )

    def __repr__(self) -> str:
        return (
            f"PatientLinkRequest("
            f"request_id={self.request_id}, "
            f"patient_name='{self.patient_name}', "
            f"status='{self.status.value}')"
        )
