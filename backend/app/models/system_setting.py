from __future__ import annotations

from sqlalchemy import BigInteger, Boolean, Integer, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class SystemSetting(BaseModel):
    """
    시스템 전역 설정. 딱 한 행만 쓴다.

    원래 .env(EARLY_WARNING_ENABLED, DANGER_SUSTAIN_SEC)에 있던 값인데,
    관리자가 서버를 재시작하지 않고 화면에서 바꿀 수 있도록 DB로 옮겼다.
    """

    __tablename__ = "system_settings"

    system_setting_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    # 조기경보(이상탐지 예측 모델) 사용 여부. 끄면 NEWS2 규칙 판정만 쓴다.
    early_warning_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("0"),
    )

    # 응급 로그를 남기기 전에 DANGER 가 이만큼(초) 이어져야 한다.
    # 센서가 한 번 튀어서 1초만 DANGER 가 나오는 경우를 걸러내기 위함.
    danger_sustain_sec: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=10,
        server_default=text("10"),
    )

    # NEWS2 응급(DANGER) 판정 경계값.
    # WARNING/ALERT 세부 기준은 NEWS2 표준 그대로 두고, 바깥쪽 경계만 의료진이 조정한다.
    heart_rate_danger_low: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=40,
        server_default=text("40"),
    )

    heart_rate_danger_high: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=131,
        server_default=text("131"),
    )

    resp_rate_danger_low: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=8,
        server_default=text("8"),
    )

    resp_rate_danger_high: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=25,
        server_default=text("25"),
    )

    def __repr__(self) -> str:
        return (
            f"SystemSetting("
            f"early_warning_enabled={self.early_warning_enabled}, "
            f"danger_sustain_sec={self.danger_sustain_sec})"
        )
