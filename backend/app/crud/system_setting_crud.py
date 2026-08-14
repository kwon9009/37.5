from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.system_setting import SystemSetting


# 단일 설정 행 조회. 없으면(최초 실행) 기본값으로 만들어서 반환한다.
def get_or_create(db: Session) -> SystemSetting:
    setting = db.scalar(select(SystemSetting).limit(1))

    if setting is not None:
        return setting

    setting = SystemSetting()

    db.add(setting)
    db.flush()

    return setting


def update(
    db: Session,
    setting: SystemSetting,
    early_warning_enabled: bool,
    danger_sustain_sec: int,
    heart_rate_danger_low: int,
    heart_rate_danger_high: int,
    resp_rate_danger_low: int,
    resp_rate_danger_high: int,
) -> SystemSetting:

    setting.early_warning_enabled = early_warning_enabled
    setting.danger_sustain_sec = danger_sustain_sec
    setting.heart_rate_danger_low = heart_rate_danger_low
    setting.heart_rate_danger_high = heart_rate_danger_high
    setting.resp_rate_danger_low = resp_rate_danger_low
    setting.resp_rate_danger_high = resp_rate_danger_high

    db.flush()

    return setting
