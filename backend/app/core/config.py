from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # SMS
    ALIGO_API_KEY: str = ""

    # 센서 오류 판별용 생리학적 한계값.
    # 사람이 의식이 있는 상태로 유지할 수 없는 값은 측정 실패로 보고 버린다.
    # (등급 판정 기준인 NEWS2와는 별개로, 순수하게 '오측정 거르기'용)
    PLAUSIBLE_HR_MIN: int = 25
    PLAUSIBLE_HR_MAX: int = 220
    PLAUSIBLE_RR_MIN: int = 5
    PLAUSIBLE_RR_MAX: int = 50

    # CORS

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
