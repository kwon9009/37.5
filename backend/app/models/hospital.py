from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String, BigInteger, UniqueConstraint, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.department import Department


class Hospital(Base):
    __tablename__ = "hospitals"
    __table_args__ = (
        UniqueConstraint("name", "address", name="uk_hospital_name_address"),
    )

    hospital_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    name: Mapped[str] = mapped_column(String(50), nullable=False)

    address: Mapped[str] = mapped_column(String(50), nullable=False)

    hospital_code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)

    bed_count: Mapped[int] = mapped_column(Integer, nullable=False)

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
            f"address='{self.address}'"
            f"hospital_code='{self.hospital_code}'"
            f"bed_count='{self.bed_count}'"
            f")"
        )
