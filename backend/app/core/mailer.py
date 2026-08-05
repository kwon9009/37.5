"""메일 발송.

Gmail SMTP를 쓴다. 문자(SMS)와 달리 발신번호 사전등록 같은 절차가 없고,
파이썬 표준 라이브러리(smtplib)만으로 되어 설치할 패키지가 없다.

MAIL_USERNAME / MAIL_PASSWORD 가 비어 있으면 실제로 보내지 않고
서버 로그에 내용을 남긴다. 팀원이 메일 계정을 준비하지 않아도
비밀번호 재설정 흐름을 개발하고 테스트할 수 있게 하기 위함이다.
"""

import logging
import smtplib
from email.message import EmailMessage
from email.utils import formataddr

from app.core.config import settings

logger = logging.getLogger(__name__)


def is_configured() -> bool:
    """실제로 메일을 보낼 수 있는 상태인지."""
    return bool(settings.MAIL_USERNAME and settings.MAIL_PASSWORD)


def send_email(
    to: str,
    subject: str,
    body: str,
) -> bool:
    """메일을 보낸다. 보냈으면 True, 설정이 없어 로그로 대체했으면 False.

    발송 실패는 예외를 그대로 올린다. 호출한 쪽에서 사용자에게
    '메일 발송에 실패했다'고 알려야 하기 때문이다.
    """

    if not is_configured():
        logger.warning(
            "메일 설정(MAIL_USERNAME/MAIL_PASSWORD)이 없어 발송을 건너뜁니다.\n"
            "--- 보내려던 메일 ---\n받는사람: %s\n제목: %s\n%s\n--------------------",
            to,
            subject,
            body,
        )
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = formataddr((settings.MAIL_FROM_NAME, settings.MAIL_USERNAME))
    message["To"] = to
    message.set_content(body)

    # 587 포트는 평문으로 연결한 뒤 starttls로 암호화한다.
    # 465 포트를 쓰는 경우는 처음부터 SSL로 연결해야 한다.
    if settings.MAIL_PORT == 465:
        with smtplib.SMTP_SSL(settings.MAIL_HOST, settings.MAIL_PORT, timeout=10) as smtp:
            smtp.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            smtp.send_message(message)
    else:
        with smtplib.SMTP(settings.MAIL_HOST, settings.MAIL_PORT, timeout=10) as smtp:
            smtp.starttls()
            smtp.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            smtp.send_message(message)

    return True
