"""센서가 보낸 측정값을 등급 판정해 DB에 반영한다.

- vital_checks       : 환자당 1행 UPDATE(덮어쓰기) - 행을 쌓지 않음
- vital_logs         : 1분 평균만 append
- patients.is_present: 재실 여부 갱신
"""

import time

from fastapi import HTTPException, status as http_status
from sqlalchemy.orm import Session

from app.crud import vital_crud
from app.models.enums import VitalStatus
from app.schemas.vitals.vitals_ingest_request import VitalsIngestRequest

# 1분 평균을 만들기 위한 환자별 임시 버퍼 (서버 메모리)
_LOG_INTERVAL_SEC = 60
_buffers: dict[int, dict] = {}

# 등급별 위험도 (숫자가 클수록 위험)
_SEVERITY = {
    VitalStatus.NORMAL: 0,
    VitalStatus.WARNING: 1,
    VitalStatus.ALERT: 2,
    VitalStatus.DANGER: 3,
}


# 심박수 등급 (scripts/seed.py가 쓰는 구간과 동일 + 서맥 쪽도 판정)
def _heart_rate_status(heart_rate: int) -> VitalStatus:

    if heart_rate >= 133 or heart_rate < 40:
        return VitalStatus.DANGER

    if heart_rate >= 108 or heart_rate < 45:
        return VitalStatus.ALERT

    if heart_rate >= 89 or heart_rate < 50:
        return VitalStatus.WARNING

    return VitalStatus.NORMAL


# 호흡수 등급
def _resp_rate_status(resp_rate: int) -> VitalStatus:

    if resp_rate >= 29 or resp_rate < 6:
        return VitalStatus.DANGER

    if resp_rate >= 23 or resp_rate < 8:
        return VitalStatus.ALERT

    if resp_rate >= 19 or resp_rate < 10:
        return VitalStatus.WARNING

    return VitalStatus.NORMAL


# 심박·호흡 중 더 위험한 쪽을 최종 등급으로 삼는다
def judge_status(
    heart_rate: int,
    resp_rate: int,
) -> VitalStatus:

    return max(
        _heart_rate_status(heart_rate),
        _resp_rate_status(resp_rate),
        key=lambda vital_status: _SEVERITY[vital_status],
    )


# 1초값을 모아 1분마다 평균을 vital_logs에 append
def _accumulate(
    db: Session,
    patient_id: int,
    heart_rate: int,
    resp_rate: int,
) -> None:

    now = time.time()
    buffer = _buffers.get(patient_id)

    if buffer is None:
        _buffers[patient_id] = {
            "heart_rates": [heart_rate],
            "resp_rates": [resp_rate],
            "started_at": now,
        }
        return

    buffer["heart_rates"].append(heart_rate)
    buffer["resp_rates"].append(resp_rate)

    # 아직 1분이 안 지났으면 계속 모으기만 한다
    if now - buffer["started_at"] < _LOG_INTERVAL_SEC:
        return

    vital_crud.create_vital_log(
        db=db,
        patient_id=patient_id,
        avg_heart_rate=round(sum(buffer["heart_rates"]) / len(buffer["heart_rates"])),
        avg_resp_rate=round(sum(buffer["resp_rates"]) / len(buffer["resp_rates"])),
    )

    _buffers[patient_id] = {
        "heart_rates": [],
        "resp_rates": [],
        "started_at": now,
    }


# 측정값 1건을 받아 DB에 반영
def ingest_vitals(
    db: Session,
    request: VitalsIngestRequest,
) -> dict:

    patient = vital_crud.get_patient(db=db, patient_id=request.patient_id)

    if patient is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="존재하지 않는 환자입니다.",
        )

    # 재실 여부는 측정값이 없어도 항상 갱신한다
    vital_crud.update_presence(
        db=db,
        patient=patient,
        is_present=request.presence,
    )

    # 아래 경우엔 생체값을 갱신하지 않고 마지막 정상값을 남겨둔다.
    #  - 사람이 없거나 신호가 끊김
    #  - 센서가 아직 안정화 중(lock을 잡는 동안 값이 무의미하게 나옴)
    # (vital_checks의 심박/호흡은 NOT NULL이라 빈 값을 넣을 수 없고,
    #  마지막 정상값을 남겨두는 편이 화면에서도 자연스럽다)
    if (
        not request.presence
        or request.stabilizing
        or request.heart_rate is None
        or request.breath_rate is None
    ):
        _buffers.pop(request.patient_id, None)
        return {"saved": False, "presence": request.presence, "status": None}

    vital_status = judge_status(
        heart_rate=request.heart_rate,
        resp_rate=request.breath_rate,
    )

    vital_crud.upsert_vital_check(
        db=db,
        patient_id=request.patient_id,
        heart_rate=request.heart_rate,
        resp_rate=request.breath_rate,  # 하드웨어 breath_rate -> DB resp_rate
        status=vital_status,
    )

    _accumulate(
        db=db,
        patient_id=request.patient_id,
        heart_rate=request.heart_rate,
        resp_rate=request.breath_rate,
    )

    return {"saved": True, "presence": True, "status": vital_status.value}
