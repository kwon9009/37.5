from __future__ import annotations

from sqlalchemy import BigInteger, Enum, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel
from app.models.enums import HospitalRequestStatus


class HospitalRequest(BaseModel):
    __tablename__ = "hospital_requests"

    hospital_request_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    hospital_name: Mapped[str] = mapped_column(String(50), nullable=False)

    area: Mapped[str] = mapped_column(String(20), nullable=False)

    address: Mapped[str] = mapped_column(String(255), nullable=False)

    status: Mapped[HospitalRequestStatus] = mapped_column(
        Enum(HospitalRequestStatus),
        nullable=False,
        default=HospitalRequestStatus.PENDING,
        server_default=text("'PENDING'"),
    )

    def __repr__(self) -> str:
        return (
            f"HospitalRequest("
            f"hospital_request_id={self.hospital_request_id}, "
            f"hospital_name='{self.hospital_name}', "
            f"status='{self.status.value}'"
            f")"
        )
