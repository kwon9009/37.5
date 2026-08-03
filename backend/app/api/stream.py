"""실시간 생체값 스트림(SSE).

화면이 N초마다 다시 물어보는 방식(폴링) 대신, 센서 값이 서버에 도착하는 순간
화면으로 밀어준다. 접속 절차는 두 단계다.

1) POST /api/stream/ticket  - 로그인 토큰으로 1회용 티켓을 받는다(여기서 권한 검사)
2) GET  /api/stream/vitals?ticket=...  - 티켓으로 접속해 값을 계속 받는다

왜 두 단계인지는 services/stream_ticket_service.py 설명 참고.
"""

import json

from fastapi import APIRouter, Depends, HTTPException, status as http_status
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.stream.stream_ticket_request import StreamTicketRequest
from app.schemas.stream.stream_ticket_response import StreamTicketResponse
from app.services import permission_service, stream_service, stream_ticket_service

router = APIRouter(
    prefix="/api/stream",
    tags=["Stream"],
)

# 연결이 살아있는지 확인하는 신호를 보내는 간격(초).
# 중간 장비(프록시·공유기)가 조용한 연결을 끊어버리는 것을 막는다.
_PING_SEC = 15


# 스트림 접속 티켓 발급 (로그인 필수, 볼 권한이 있는지 여기서 검사)
@router.post(
    "/ticket",
    response_model=StreamTicketResponse,
)
def create_stream_ticket(
    request: StreamTicketRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    if request.scope == "patient":

        if request.patient_id is None:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="patient_id가 필요합니다.",
            )

        # 관리자/담당 부서/연결된 보호자만 통과한다
        patient = permission_service.ensure_can_access_patient(
            db=db,
            current_user=current_user,
            patient_id=request.patient_id,
        )

        ticket, expires_in = stream_ticket_service.issue(
            scope="patient",
            user_id=current_user.user_id,
            patient_id=patient.patient_id,
        )

    else:

        # 부서 전체 구독은 부서 계정만 가능하다 (대시보드와 같은 기준)
        department = permission_service.get_department_or_403(
            db=db,
            user_id=current_user.user_id,
        )

        ticket, expires_in = stream_ticket_service.issue(
            scope="department",
            user_id=current_user.user_id,
            department_id=department.department_id,
        )

    return StreamTicketResponse(
        ticket=ticket,
        expires_in=expires_in,
    )


# 실시간 생체값 스트림. 티켓에 담긴 범위(환자 1명 / 부서 전체)만 흘려보낸다.
@router.get("/vitals")
async def stream_vitals(ticket: str):

    info = stream_ticket_service.consume(ticket)

    patient_id = info.get("patient_id")
    department_id = info.get("department_id")

    async def event_generator():

        # 접속 직후 빈 화면이 보이지 않도록 마지막 값을 먼저 한 번 보낸다
        for snapshot in stream_service.get_snapshot(
            patient_id=patient_id,
            department_id=department_id,
        ):
            yield {"event": "vitals", "data": json.dumps(snapshot)}

        # 이후로는 새 값이 들어오는 즉시 밀어준다
        async for payload in stream_service.subscribe(
            patient_id=patient_id,
            department_id=department_id,
        ):
            yield {"event": "vitals", "data": json.dumps(payload)}

    return EventSourceResponse(
        event_generator(),
        ping=_PING_SEC,
    )
