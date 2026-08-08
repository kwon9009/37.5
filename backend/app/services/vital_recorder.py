"""실측 세션 동안 1초 측정값과 판정 결과를 파일로 남긴다.

왜 필요한가:
  1초 원시값은 DB에 저장하지 않는다(CLAUDE.md 방침 - 행을 쌓지 않음).
  anomaly_engine의 버퍼도 서버 메모리라 재시작하면 사라진다.
  그래서 실측을 해도 "규칙 판정과 예측 모델이 각각 뭐라고 했는지"를
  나중에 다시 볼 수가 없다. 이 기록이 그 비교를 가능하게 한다.

무엇을 남기나:
  측정 1건당 한 줄(JSON). 센서가 보낸 원값, 신뢰 판정 결과,
  NEWS2 규칙 등급, 예측 모델 등급·점수, 최종 등급을 함께 남긴다.
  셋을 같은 줄에 두어야 "모델이 규칙과 어디서 달라졌는지"를 셀 수 있다.

켜는 법:
  .env 에 기록할 파일 경로를 넣는다. 비워두면 아무것도 하지 않는다.
    VITAL_RECORD_PATH=records/session1.ndjson

  운영에서는 꺼둔다. 실측·분석할 때만 켜는 도구다.

형식은 NDJSON(한 줄에 JSON 하나). 세션 도중 서버가 죽어도 그 줄까지는
남고, 분석 스크립트가 한 줄씩 읽으면 되기 때문이다.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from threading import Lock

from app.core.config import settings

_lock = Lock()
_path: Path | None = None
_resolved = False
_failed = False


def _target() -> Path | None:
    """기록 경로. 설정이 비어 있으면 None(기록 안 함)."""
    global _path, _resolved

    if _resolved:
        return _path

    _resolved = True
    configured = (settings.VITAL_RECORD_PATH or "").strip()

    if not configured:
        return None

    _path = Path(configured)
    _path.parent.mkdir(parents=True, exist_ok=True)
    return _path


def is_enabled() -> bool:
    return _target() is not None


def record(payload: dict) -> None:
    """측정 1건을 한 줄로 남긴다.

    기록은 어디까지나 분석용 부가 기능이라, 여기서 실패해도 측정값 처리
    자체를 막지 않는다. 파일을 못 쓰는 상황(권한·디스크)에서 환자 모니터링이
    멈추는 쪽이 훨씬 위험하다. 대신 첫 실패는 한 번 알려준다.
    """
    global _failed

    target = _target()

    if target is None:
        return

    line = json.dumps(payload, ensure_ascii=False, default=str)

    try:
        with _lock:
            with target.open("a", encoding="utf-8") as file:
                file.write(line + "\n")
    except OSError as error:
        if not _failed:
            _failed = True
            print(f"[기록] 실측 기록 실패 (이후 조용히 넘어갑니다): {error}")


def build_entry(
    patient_id: int,
    request_heart_rate: int | None,
    request_resp_rate: int | None,
    presence: bool,
    stabilizing: bool,
    measured_at: datetime | None,
    result: dict,
) -> dict:
    """저장 결과(result)를 기록 한 줄로 바꾼다.

    news2 / model / final 을 같은 줄에 두는 것이 핵심이다. 나중에
    "규칙은 정상인데 모델만 주의로 올린 초"가 몇 초인지 세야 하기 때문이다.
    """
    return {
        "t": (measured_at or datetime.now()).isoformat(timespec="seconds"),
        "pid": patient_id,
        # 하드웨어가 보낸 원값 (신뢰 판정 전)
        "hr_raw": request_heart_rate,
        "rr_raw": request_resp_rate,
        "presence": presence,
        "stabilizing": stabilizing,
        # 처리 결과
        "saved": result.get("saved", False),
        "rejected": result.get("rejected"),
        "hr": result.get("heart_rate"),
        "rr": result.get("resp_rate"),
        "resp_replaced": result.get("resp_replaced", False),
        # 판정 세 가지
        "news2": result.get("news2"),
        "model": result.get("model"),
        "score": result.get("score"),
        "final": result.get("status"),
        "reasons": result.get("reasons"),
    }
