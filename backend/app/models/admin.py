from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.admin_hospital import AdminHospital
    from app.models.user import User


class Admin(BaseModel):
    __tablename__ = "admins"

    admin_id: Mapped[int] = mapped_column(
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

    name: Mapped[str] = mapped_column(String(20), nullable=False)

    email: Mapped[str] = mapped_column(String(50), nullable=False)

    phone: Mapped[str] = mapped_column(String(20), nullable=False)

    # Relationship
    user: Mapped["User"] = relationship(
        "User",
        back_populates="admin",
    )

    admin_hospitals: Mapped[list["AdminHospital"]] = relationship(
        "AdminHospital",
        back_populates="admin",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"Admin(admin_id={self.admin_id}, name='{self.name}')"
