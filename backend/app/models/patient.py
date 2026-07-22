from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Date,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    BigInteger,
    Boolean,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import Gender, PatientStatus

if TYPE_CHECKING:
    from app.models.alert import Alert
    from app.models.department import Department
    from app.models.device import Device
    from app.models.emergency_log import EmergencyLog
    from app.models.patient_guardian import PatientGuardian
    from app.models.vital_check import VitalCheck
    from app.models.vital_log import VitalLog


class Patient(BaseModel):
    __tablename__ = "patients"

    patient_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    department_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("departments.department_id"),
        nullable=False,
    )

    patient_no: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    birthdate: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    gender: Mapped[Gender] = mapped_column(
        Enum(Gender),
        nullable=False,
    )

    ward: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    room_num: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    bed_num: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    special_notes: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[PatientStatus] = mapped_column(
        Enum(PatientStatus),
        nullable=False,
    )

    is_present: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("1"),
    )

    admission_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    discharge_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    # Relationship
    department: Mapped[Department] = relationship(
        back_populates="patients",
    )

    patient_guardians: Mapped[list["PatientGuardian"]] = relationship(
        "PatientGuardian",
        back_populates="patient",
        passive_deletes=True,
    )

    devices: Mapped[list[Device]] = relationship(
        back_populates="patient",
        passive_deletes=True,
    )

    vital_checks: Mapped[list[VitalCheck]] = relationship(
        back_populates="patient",
        passive_deletes=True,
    )

    vital_logs: Mapped[list[VitalLog]] = relationship(
        back_populates="patient",
        passive_deletes=True,
    )

    emergency_logs: Mapped[list[EmergencyLog]] = relationship(
        back_populates="patient",
        passive_deletes=True,
    )

    alerts: Mapped[list[Alert]] = relationship(
        back_populates="patient",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return (
            f"Patient("
            f"patient_id={self.patient_id}, "
            f"patient_no='{self.patient_no}', "
            f"name='{self.name}')"
        )
