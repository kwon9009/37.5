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

    # 비밀번호 재설정 메일 (Gmail SMTP)
    # 비워두면 메일을 보내지 않고 서버 로그에만 링크를 남긴다.
    # 팀원이 메일 계정 없이도 나머지 기능을 개발할 수 있게 하기 위함.
    MAIL_HOST: str = "smtp.gmail.com"
    MAIL_PORT: int = 587
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM_NAME: str = "37.5 SmartCare"

    # 재설정 링크를 만들 때 앞에 붙일 주소. 배포하면 실제 도메인으로 바꾼다.
    FRONTEND_BASE_URL: str = "http://localhost:5173"

    # 재설정 링크 유효시간(분). 짧을수록 안전하고,
    # 메일을 확인하고 새 비밀번호를 정하는 데 걸리는 시간보다는 길어야 한다.
    PASSWORD_RESET_EXPIRE_MINUTES: int = 30

    # 센서 오류 판별용 생리학적 한계값.
    # 사람이 의식이 있는 상태로 유지할 수 없는 값은 측정 실패로 보고 버린다.
    # (등급 판정 기준인 NEWS2와는 별개로, 순수하게 '오측정 거르기'용)
    PLAUSIBLE_HR_MIN: int = 25
    PLAUSIBLE_HR_MAX: int = 220
    PLAUSIBLE_RR_MIN: int = 5
    PLAUSIBLE_RR_MAX: int = 50

    # 호흡 급변 판정. 사람의 호흡수는 1초 사이에 이만큼 변하지 않는다.
    # 레이더가 흉곽 대신 다른 움직임을 잡으면 18 -> 6 처럼 튀는데,
    # 그대로 받으면 멀쩡한 사람이 갑자기 '호흡 위험'으로 판정된다.
    # (실측 2,438쌍 기준 1초 변화량은 67%가 0~2, 6 이상은 9.6%)
    RESP_MAX_JUMP: int = 6

    # 직전 호흡값이 이 시간(초) 안에 측정됐을 때만 급변을 따진다.
    # 신호가 한참 끊겼다 다시 잡힌 것은 '급변'이 아니라 '재측정'이다.
    RESP_JUMP_WINDOW_SEC: float = 5

    # 조기경보(이상탐지 예측 모델) 사용 여부.
    # 끄면 NEWS2 규칙 판정만 쓴다. 조기경보는 등급을 올리기만 하고 내리지 못하므로,
    # 꺼도 기존 판정·응급 감지 경로는 그대로 동작한다.
    # 화면이 온통 '주의'로 뜨는 등 문제가 생기면 이 값만 false로 바꿔 즉시 되돌린다.
    EARLY_WARNING_ENABLED: bool = True

    # 응급 로그를 남기기 전에 DANGER가 이만큼(초) 이어져야 한다.
    # 센서가 한 번 튀어서 1초만 DANGER가 나오는 경우를 응급으로 기록하지 않기 위함.
    # (건수가 아니라 시각으로 재므로, 전송 주기가 흔들려도 기준이 흔들리지 않는다)
    DANGER_SUSTAIN_SEC: float = 10

    # 실시간 스트림(SSE) 접속 티켓 유효시간(초).
    # 짧을수록 안전하고, 화면이 티켓을 받아 접속하는 데 걸리는 시간보다는 길어야 한다.
    STREAM_TICKET_TTL_SEC: int = 60

    # 실측 기록 파일 경로. 비워두면 기록하지 않는다(운영 기본값).
    # 1초 원시값은 DB에 쌓지 않기 때문에, 실측 후 "규칙과 모델이 각각 뭐라고
    # 했는지"를 다시 보려면 세션 중에만 따로 남겨둬야 한다.
    # 실측할 때만 켠다:  VITAL_RECORD_PATH=records/session1.ndjson
    VITAL_RECORD_PATH: str = ""

    # CORS

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
