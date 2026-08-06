from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    TIMESTAMP,
    BigInteger,
    Date,
    Enum,
    ForeignKey,
    Index,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import PatientLinkRequestStatus

if TYPE_CHECKING:
    from app.models.guardian import Guardian
    from app.models.hospital import Hospital


class PatientLinkRequest(BaseModel):
    __tablename__ = "patient_link_requests"

    # 2026-08-05: UNIQUE(guardian_id, hospital_id, patient_name, birthdate) 삭제됨.
    # 한 번 거절되면 같은 정보로 재신청이 영영 불가능해지기 때문.
    # (MySQL은 '대기 중인 것만 중복 금지' 같은 조건부 UNIQUE를 지원하지 않음)
    # 대기 중 중복 신청 검사는 서버 코드에서 처리한다.
    __table_args__ = (
        # 병원의 '대기 중 신청 목록' 조회용
        Index("idx_link_request_lookup", "hospital_id", "status"),
        # 보호자의 '내 신청 상태' 조회용
        Index("idx_link_request_guardian", "guardian_id", "status"),
    )

    request_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    guardian_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("guardians.guardian_id"),
        nullable=False,
    )

    hospital_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("hospitals.hospital_id"),
        nullable=False,
    )

    patient_name: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    birthdate: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    relation: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    status: Mapped[PatientLinkRequestStatus] = mapped_column(
        Enum(PatientLinkRequestStatus),
        nullable=False,
        default=PatientLinkRequestStatus.PENDING,
    )

    # 병원이 승인/거절 버튼을 누른 시각. 대기 중(PENDING)이면 NULL.
    # created_at(신청한 시각)과 짝을 이뤄 "처리까지 얼마나 걸렸는지"를 알 수 있다.
    processed_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP,
        nullable=True,
    )

    # Relationship
    guardian: Mapped["Guardian"] = relationship(
        "Guardian",
        back_populates="patient_link_requests",
    )

    hospital: Mapped["Hospital"] = relationship(
        "Hospital",
        back_populates="patient_link_requests",
    )

    def __repr__(self) -> str:
        return (
            f"PatientLinkRequest("
            f"request_id={self.request_id}, "
            f"patient_name='{self.patient_name}', "
            f"status='{self.status.value}')"
        )
