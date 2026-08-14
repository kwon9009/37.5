from pydantic import BaseModel, Field, model_validator

# NEWS2 표준값: 심박 danger_low=40 / danger_high=131, 호흡 danger_low=8 / danger_high=25.
# 의료진마다 원하는 민감도가 다를 수 있어 조정은 허용하되, 임상 표준에서 너무
# 벗어난 값(예: 응급 기준을 200bpm으로)은 서버가 거부한다. WARNING/ALERT 세부
# 기준은 조정 대상이 아니다(app/services/vital_service.py 참고).
_HEART_RATE_LOW_RANGE = (30, 50)
_HEART_RATE_HIGH_RANGE = (121, 141)
_RESP_RATE_LOW_RANGE = (3, 13)
_RESP_RATE_HIGH_RANGE = (20, 30)


class AdminSystemSettingsUpdateRequest(BaseModel):
    early_warning_enabled: bool
    danger_sustain_sec: int = Field(..., ge=0, le=300)

    heart_rate_danger_low: int = Field(..., ge=_HEART_RATE_LOW_RANGE[0], le=_HEART_RATE_LOW_RANGE[1])
    heart_rate_danger_high: int = Field(..., ge=_HEART_RATE_HIGH_RANGE[0], le=_HEART_RATE_HIGH_RANGE[1])
    resp_rate_danger_low: int = Field(..., ge=_RESP_RATE_LOW_RANGE[0], le=_RESP_RATE_LOW_RANGE[1])
    resp_rate_danger_high: int = Field(..., ge=_RESP_RATE_HIGH_RANGE[0], le=_RESP_RATE_HIGH_RANGE[1])

    @model_validator(mode="after")
    def _check_low_below_high(self) -> "AdminSystemSettingsUpdateRequest":
        if self.heart_rate_danger_low >= self.heart_rate_danger_high:
            raise ValueError("심박 응급 하한은 상한보다 작아야 합니다.")

        if self.resp_rate_danger_low >= self.resp_rate_danger_high:
            raise ValueError("호흡 응급 하한은 상한보다 작아야 합니다.")

        return self
