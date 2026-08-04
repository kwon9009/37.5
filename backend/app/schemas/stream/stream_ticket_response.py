from pydantic import BaseModel


class StreamTicketResponse(BaseModel):
    """발급된 스트림 접속 티켓.

    ticket     : /api/stream/vitals?ticket=... 형태로 붙여 접속한다 (1회용)
    expires_in : 유효시간(초). 이 시간 안에 접속하지 않으면 다시 발급받아야 한다.
    """

    ticket: str
    expires_in: int
