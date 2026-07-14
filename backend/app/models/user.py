from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Boolean, Enum, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import UserRole

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.guardian import Guardian


class User(BaseModel):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(
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

    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("1"),
    )

    # Relationship

    department: Mapped["Department | None"] = relationship(
        "Department",
        back_populates="user",
        uselist=False,
        passive_deletes=True,
    )

    guardian: Mapped["Guardian | None"] = relationship(
        "Guardian",
        back_populates="user",
        uselist=False,
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return (
            f"User("
            f"user_id={self.user_id}, "
            f"login_id='{self.login_id}', "
            f"role='{self.role.value}'"
            f")"
        )
