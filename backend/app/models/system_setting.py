from sqlalchemy import BigInteger, Boolean, Integer, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


# 시스템 전역 설정. 딱 한 행만 쓴다(단일 설정 레코드).
# .env(EARLY_WARNING_ENABLED, DANGER_SUSTAIN_SEC)에 있던 값을 관리자가
# 서버 재시작 없이 화면에서 바꿀 수 있도록 DB로 옮긴 것.
class SystemSetting(BaseModel):
    __tablename__ = "system_settings"

    system_setting_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    early_warning_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )

    danger_sustain_sec: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("10"),
    )

    # NEWS2 응급(DANGER) 판정 경계값. 의료진마다 원하는 민감도가 조금씩 달라서
    # 조정 가능하게 열어두되, WARNING/ALERT 단계의 세부 기준은 NEWS2 표준을
    # 그대로 두고 이 바깥쪽 경계만 움직인다. 서버가 NEWS2 기본값 근처(±허용치)로만
    # 바꿀 수 있게 검증한다 - app/schemas/admin/system_settings_update_request.py 참고.
    heart_rate_danger_low: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("40"),
    )

    heart_rate_danger_high: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("131"),
    )

    resp_rate_danger_low: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("8"),
    )

    resp_rate_danger_high: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default=text("25"),
    )

    def __repr__(self) -> str:
        return (
            f"SystemSetting("
            f"early_warning_enabled={self.early_warning_enabled}, "
            f"danger_sustain_sec={self.danger_sustain_sec})"
        )
