from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String, BigInteger, UniqueConstraint, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.patient_link_request import PatientLinkRequest


class Hospital(Base):
    __tablename__ = "hospitals"
    __table_args__ = (
        UniqueConstraint("name", "address", name="uk_hospital_name_address"),
    )

    hospital_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    name: Mapped[str] = mapped_column(String(50), nullable=False)

    # 병원이 속한 시·도(예: "대전광역시"). 보호자가 병원을 지역으로 골라 찾는 데 쓴다.
    area: Mapped[str] = mapped_column(String(20), nullable=False)

    address: Mapped[str] = mapped_column(String(255), nullable=False)

    hospital_code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)

    bed_count: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationship
    departments: Mapped[list["Department"]] = relationship(
        "Department",
        back_populates="hospital",
        passive_deletes=True,
    )

    patient_link_requests: Mapped[list["PatientLinkRequest"]] = relationship(
        "PatientLinkRequest",
        back_populates="hospital",
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
