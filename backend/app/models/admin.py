from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, BigInteger, ForeignKey, String, text
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

    # 전체 병원을 보는 슈퍼관리자인지. admin_hospitals는 "담당자 표시"용으로 따로
    # 쓰이고 있어서(병원 등록 시 기본값으로 전부 연결됨) 접근 범위 판단에 못 쓴다.
    is_super_admin: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )

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
