from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.admin import Admin
    from app.models.hospital import Hospital


class AdminHospital(Base):
    __tablename__ = "admin_hospitals"
    __table_args__ = (UniqueConstraint("admin_id", "hospital_id", name="uk_admin_hospital"),)

    admin_hospital_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    admin_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "admins.admin_id",
            ondelete="CASCADE",
        ),
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

    # Relationship
    admin: Mapped["Admin"] = relationship(
        "Admin",
        back_populates="admin_hospitals",
    )

    hospital: Mapped["Hospital"] = relationship("Hospital")

    def __repr__(self) -> str:
        return f"AdminHospital(admin_id={self.admin_id}, hospital_id={self.hospital_id})"
