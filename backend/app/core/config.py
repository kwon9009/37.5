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

    # 실시간 스트림(SSE) 접속 티켓 유효시간(초).
    # 짧을수록 안전하고, 화면이 티켓을 받아 접속하는 데 걸리는 시간보다는 길어야 한다.
    STREAM_TICKET_TTL_SEC: int = 60

    # CORS

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
