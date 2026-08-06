from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String, BigInteger, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.patient_guardian import PatientGuardian
    from app.models.alert import Alert
    from app.models.user import User
    from app.models.patient_link_request import PatientLinkRequest


class Guardian(BaseModel):
    __tablename__ = "guardians"

    guardian_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
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

    name: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    # Relationship
    user: Mapped["User"] = relationship(
        "User",
        back_populates="guardian",
    )

    patient_link_requests: Mapped[list["PatientLinkRequest"]] = relationship(
        "PatientLinkRequest",
        back_populates="guardian",
    )

    patient_guardians: Mapped[list["PatientGuardian"]] = relationship(
        "PatientGuardian",
        back_populates="guardian",
        passive_deletes=True,
    )

    alerts: Mapped[list["Alert"]] = relationship(
        back_populates="guardian",
    )

    def __repr__(self) -> str:
        return (
            f"Guardian("
            f"guardian_id={self.guardian_id}, "
            f"user_id={self.user_id}, "
            f"name='{self.name}'"
            f")"
        )
