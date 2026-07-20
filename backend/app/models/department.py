from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, BigInteger, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.hospital import Hospital
    from app.models.patient import Patient
    from app.models.alert import Alert
    from app.models.user import User


class Department(BaseModel):
    __tablename__ = "departments"
    __table_args__ = (
        UniqueConstraint("hospital_id", "name", name="uk_department_hospital_name"),
    )

    department_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "users.user_id",
            ondelete="CASCADE",
        ),
        unique=True,
        nullable=False,
    )

    hospital_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "hospitals.hospital_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(String(20), nullable=False)

    # Relationship
    user: Mapped["User"] = relationship(
        "User",
        back_populates="department",
    )

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
            f"user_id={self.user_id}, "
            f"name='{self.name}'"
            f")"
        )
