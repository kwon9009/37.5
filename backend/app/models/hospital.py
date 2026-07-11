from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.department import Department


class Hospital(Base):
    __tablename__ = "hospitals"

    hospital_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    name: Mapped[str] = mapped_column(String(50), nullable=False)

    area: Mapped[str] = mapped_column(String(20), nullable=False)

    # Relationship
    departments: Mapped[list["Department"]] = relationship(
        "Department",
        back_populates="hospital",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return (
            f"Hospital("
            f"hospital_id={self.hospital_id}, "
            f"name='{self.name}', "
            f"area='{self.area}'"
            f")"
        )
