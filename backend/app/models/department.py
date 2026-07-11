from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.hospital import Hospital
    from app.models.patient import Patient
    from app.models.alert import Alert


class Department(BaseModel):
    __tablename__ = "departments"

    department_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    hospital_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "hospitals.hospital_id",
        ),
        nullable=False,
    )

    login_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    password: Mapped[str] = mapped_column(String(255), nullable=False)

    name: Mapped[str] = mapped_column(String(20), nullable=False)

    # Relationship
    hospital: Mapped["Hospital"] = relationship(
        "Hospital", back_populates="departments"
    )

    patients: Mapped[list["Patient"]] = relationship(
        "Patient", back_populates="department"
    )

    alerts: Mapped[list["Alert"]] = relationship("Alert", back_populates="department")

    def __repr__(self) -> str:
        return (
            f"Department("
            f"department_id={self.department_id}, "
            f"name='{self.name}'"
            f")"
        )
