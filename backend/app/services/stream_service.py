"""측정값이 들어오는 즉시 화면으로 밀어주는(SSE) 방송 브로커.

폴링(화면이 N초마다 다시 물어보기)은 아무리 짧게 잡아도 그 간격만큼 늦는다.
여기서는 반대로, 센서 값이 서버에 도착하는 순간 구독 중인 화면들에게 밀어준다.

동작 방식
- 화면이 접속하면 구독자(_Subscriber)를 하나 만들어 대기열(Queue)을 준다.
- 센서 값이 들어오면 publish()가 조건에 맞는 구독자들의 대기열에 값을 넣는다.
- 구독자는 대기열에서 값이 나오는 즉시 화면으로 흘려보낸다.

주의: 값은 DB가 아니라 서버 메모리에만 잠깐 머문다(마지막 값 1건).
      서버를 재시작하면 사라지지만, 실제 기록은 DB에 따로 남으므로 문제 없다.
"""

import asyncio
from collections.abc import AsyncGenerator
from dataclasses import dataclass

# 화면이 잠깐 느려져도 서버가 밀리지 않도록 구독자당 보관 한도를 둔다.
# 가득 차면 가장 오래된 값부터 버린다(생체값은 최신값이 가장 중요하므로).
_QUEUE_MAX = 20


@dataclass(eq=False)
class _Subscriber:
    """화면 하나당 하나씩 만들어지는 구독 정보."""

    queue: asyncio.Queue
    loop: asyncio.AbstractEventLoop
    patient_id: int | None  # 값이 있으면 그 환자만 받는다
    department_id: int | None  # 값이 있으면 그 부서 환자 전체를 받는다


_subscribers: set[_Subscriber] = set()

# 환자별 마지막 방송값. 화면이 막 접속했을 때 다음 측정(최대 1초)을 기다리지 않고
# 곧바로 무언가 보여주기 위한 용도.
_latest: dict[int, dict] = {}


# 대기열에 값을 넣는다. 가득 찼으면 가장 오래된 값을 버리고 넣는다.
def _put(queue: asyncio.Queue, payload: dict) -> None:

    if queue.full():

        try:
            queue.get_nowait()
        except asyncio.QueueEmpty:
            pass

    queue.put_nowait(payload)


# 측정값 1건을 조건에 맞는 모든 구독자에게 방송한다.
# 이 함수는 FastAPI의 일반(sync) 엔드포인트에서 호출되므로,
# 구독자가 살고 있는 이벤트 루프로 안전하게 넘겨준다(call_soon_threadsafe).
def publish(payload: dict) -> None:

    patient_id = payload.get("patient_id")
    department_id = payload.get("department_id")

    if patient_id is not None:
        _latest[patient_id] = payload

    for subscriber in list(_subscribers):

        if subscriber.patient_id is not None and subscriber.patient_id != patient_id:
            continue

        if (
            subscriber.department_id is not None
            and subscriber.department_id != department_id
        ):
            continue

        try:
            subscriber.loop.call_soon_threadsafe(_put, subscriber.queue, payload)
        except RuntimeError:
            # 화면이 이미 닫혀 이벤트 루프가 사라진 경우
            _subscribers.discard(subscriber)


# 접속 직후 화면이 비어 보이지 않게 마지막 값을 꺼내준다.
def get_snapshot(
    patient_id: int | None = None,
    department_id: int | None = None,
) -> list[dict]:

    if patient_id is not None:
        latest = _latest.get(patient_id)
        return [latest] if latest else []

    if department_id is not None:
        return [
            payload
            for payload in _latest.values()
            if payload.get("department_id") == department_id
        ]

    return []


# 구독 시작. 값이 들어올 때까지 대기하다가 도착하면 즉시 흘려보낸다.
async def subscribe(
    patient_id: int | None = None,
    department_id: int | None = None,
) -> AsyncGenerator[dict, None]:

    subscriber = _Subscriber(
        queue=asyncio.Queue(maxsize=_QUEUE_MAX),
        loop=asyncio.get_running_loop(),
        patient_id=patient_id,
        department_id=department_id,
    )

    _subscribers.add(subscriber)

    try:
        while True:
            yield await subscriber.queue.get()

    finally:
        # 화면을 닫거나 새로고침하면 여기로 온다. 반드시 정리해야 메모리가 샌다.
        _subscribers.discard(subscriber)


# 현재 접속 중인 화면 수 (점검·테스트용)
def subscriber_count() -> int:
    return len(_subscribers)
