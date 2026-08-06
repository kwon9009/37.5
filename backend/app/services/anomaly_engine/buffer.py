"""환자별 최근 원시 센서값을 메모리에서만 굴리는 버퍼.

CLAUDE.md 방침("현재 상태 테이블에 행을 계속 쌓지 말 것")에 맞춰, 60초 윈도우
계산에 필요한 초 단위 원시값은 DB에 저장하지 않고 서버 메모리에만 보관한다.
서버가 재시작되면 버퍼는 비워지고, 다시 window_seconds만큼 데이터가 쌓일 때까지
간이 임계값 판정(engine._fallback_status)으로 대체된다.
"""
from __future__ import annotations

from collections import defaultdict, deque
from threading import Lock

import pandas as pd


class VitalBuffer:
    def __init__(self, maxlen: int = 180) -> None:
        self._maxlen = maxlen
        self._data: dict[str, deque] = defaultdict(lambda: deque(maxlen=maxlen))
        self._lock = Lock()

    def push(self, patient_id: str, reading: dict) -> None:
        with self._lock:
            self._data[patient_id].append(reading)

    def get_dataframe(self, patient_id: str) -> pd.DataFrame:
        with self._lock:
            rows = list(self._data.get(patient_id, ()))
        return pd.DataFrame(rows)
