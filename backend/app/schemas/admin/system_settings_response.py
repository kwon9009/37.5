from pydantic import BaseModel


class AdminSystemSettingsResponse(BaseModel):
    early_warning_enabled: bool
    danger_sustain_sec: int
    heart_rate_danger_low: int
    heart_rate_danger_high: int
    resp_rate_danger_low: int
    resp_rate_danger_high: int
