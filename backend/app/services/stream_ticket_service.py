"""실시간 스트림(SSE) 접속용 1회용 티켓.

왜 필요한가
- 다른 API는 요청 헤더에 로그인 토큰(Authorization: Bearer ...)을 실어 보낸다.
- 그런데 브라우저의 SSE 접속 도구(EventSource)는 헤더를 붙일 수 없다.
- 그래서 로그인 토큰을 주소(?token=...)에 붙이는 방법이 흔히 쓰이지만,
  주소는 브라우저 기록·서버 접속로그·중간 장비에 그대로 남는다.
  로그인 토큰(30분짜리)이 새면 그 시간 동안 모든 API를 대신 호출할 수 있다.

그래서 이렇게 한다
1) 로그인 토큰으로 티켓을 발급받는다(POST /api/stream/ticket). 이때 권한 검사를 한다.
2) 티켓만 주소에 붙여 스트림에 접속한다.
3) 티켓은 60초짜리 + 1번 쓰면 폐기 + 스트림 접속에만 쓸 수 있다.
   유출돼도 피해가 거의 없다.
"""

import secrets
import time
from typing import Literal

from fastapi import HTTPException, status as http_status

from app.core.config import settings

StreamScope = Literal["patient", "department"]

# 발급된 티켓 보관소 (서버 메모리)
_tickets: dict[str, dict] = {}


# 만료된 티켓 정리 (발급할 때마다 청소하므로 따로 스케줄러가 필요 없다)
def _purge_expired(now: float) -> None:

    expired = [
        ticket for ticket, info in _tickets.items() if info["expires_at"] <= now
    ]

    for ticket in expired:
        del _tickets[ticket]


# 티켓 발급. 권한 검사는 호출하는 쪽(api/stream.py)에서 이미 끝난 상태여야 한다.
def issue(
    scope: StreamScope,
    user_id: int,
    patient_id: int | None = None,
    department_id: int | None = None,
) -> tuple[str, int]:

    now = time.time()
    _purge_expired(now)

    ttl = settings.STREAM_TICKET_TTL_SEC
    ticket = secrets.token_urlsafe(32)

    _tickets[ticket] = {
        "scope": scope,
        "user_id": user_id,
        "patient_id": patient_id,
        "department_id": department_id,
        "expires_at": now + ttl,
    }

    return ticket, ttl


# 티켓 사용. 꺼내는 즉시 폐기하므로 같은 티켓을 두 번 쓸 수 없다.
def consume(ticket: str) -> dict:

    info = _tickets.pop(ticket, None)

    if info is None or info["expires_at"] <= time.time():
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않거나 만료된 스트림 티켓입니다.",
        )

    return info


# 남아있는 티켓 수 (점검·테스트용)
def pending_count() -> int:
    return len(_tickets)
