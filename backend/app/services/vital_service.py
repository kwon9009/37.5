"""센서가 보낸 측정값을 등급 판정해 DB에 반영한다.

- vital_checks       : 환자당 1행 UPDATE(덮어쓰기) - 행을 쌓지 않음
- vital_logs         : 1분 평균만 append
- patients.is_present: 재실 여부 갱신

등급 판정 기준은 NEWS2(National Early Warning Score 2, 영국 왕립의사회 2017)를
따른다. 환자 상태 악화를 조기에 발견하기 위한 국제 표준 척도로, 심박·호흡 모두
'너무 높을 때'와 '너무 낮을 때'를 같은 위험도로 본다.
주의: NEWS2는 성인(16세 이상) 기준이며 소아·임신부에게는 적용하지 않는다.

센서 오류는 심박과 호흡을 '따로' 판단한다. mmWave 레이더는 심장 박동을 잡으면서도
흉곽 움직임(호흡)은 자주 놓치는데, 그때마다 멀쩡한 심박까지 버리면 화면에
아무것도 뜨지 않기 때문이다. 실제로 호흡이 1이나 빈 값으로 오는 동안에도
심박은 74~77로 안정적으로 측정됐다.
"""

import time
from datetime import datetime

from fastapi import HTTPException, status as http_status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud import vital_crud
from app.models.enums import VitalStatus
from app.models.patient import Patient
from app.schemas.vitals.vitals_ingest_request import VitalsIngestRequest
from app.services import stream_service

# 1분 평균을 만들기 위한 환자별 임시 버퍼 (서버 메모리)
_LOG_INTERVAL_SEC = 60
_buffers: dict[int, dict] = {}

# NEWS2 점수 -> 우리 등급
_SCORE_TO_STATUS = {
    0: VitalStatus.NORMAL,
    1: VitalStatus.WARNING,
    2: VitalStatus.ALERT,
    3: VitalStatus.DANGER,
}


# 심박수 NEWS2 점수
#   <=40:3  41~50:1  51~90:0  91~110:1  111~130:2  >=131:3
def _heart_rate_score(heart_rate: int) -> int:

    if heart_rate <= 40 or heart_rate >= 131:
        return 3

    if 111 <= heart_rate <= 130:
        return 2

    if 41 <= heart_rate <= 50 or 91 <= heart_rate <= 110:
        return 1

    return 0


# 호흡수 NEWS2 점수
#   <=8:3  9~11:1  12~20:0  21~24:2  >=25:3
def _resp_rate_score(resp_rate: int) -> int:

    if resp_rate <= 8 or resp_rate >= 25:
        return 3

    if 21 <= resp_rate <= 24:
        return 2

    if 9 <= resp_rate <= 11:
        return 1

    return 0


# 심박·호흡 중 더 위험한 쪽을 최종 등급으로 삼는다
# (NEWS2도 한 항목만 3점이어도 즉시 의료진 확인 대상으로 본다)
#
# resp_rate가 None이면 이번엔 호흡을 믿을 수 없다는 뜻이라 심박만으로 판정한다.
# 못 믿는 호흡값으로 위험 판정을 내리면 가짜 응급이 만들어지기 때문이다.
def judge_status(
    heart_rate: int,
    resp_rate: int | None = None,
) -> VitalStatus:

    score = _heart_rate_score(heart_rate)

    if resp_rate is not None:
        score = max(score, _resp_rate_score(resp_rate))

    return _SCORE_TO_STATUS[score]


# 심박을 믿을 수 있는가.
# 심박은 등급 판정의 기준 신호라, 이걸 못 믿으면 이번 측정은 쓸 수 없다.
def _is_heart_rate_trustworthy(heart_rate: int | None) -> bool:

    if heart_rate is None:
        return False

    return settings.PLAUSIBLE_HR_MIN <= heart_rate <= settings.PLAUSIBLE_HR_MAX


# 호흡만 위험 구간인데 심박이 멀쩡하면 센서 오류를 의심한다.
# 실제로 환자 상태가 나빠지면 심박·호흡이 함께 무너지므로,
# 호흡만 튀는 경우는 레이더가 흉곽 움직임을 놓친 것으로 보는 편이 안전하다.
def _is_resp_suspicious(heart_rate: int, resp_rate: int) -> bool:

    return _resp_rate_score(resp_rate) == 3 and _heart_rate_score(heart_rate) == 0


# 호흡을 믿을 수 있는가. 심박과 별개로 판단한다.
def _is_resp_rate_trustworthy(heart_rate: int, resp_rate: int | None) -> bool:

    if resp_rate is None:
        return False

    if not (settings.PLAUSIBLE_RR_MIN <= resp_rate <= settings.PLAUSIBLE_RR_MAX):
        return False

    return not _is_resp_suspicious(heart_rate=heart_rate, resp_rate=resp_rate)


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


# 측정값 1건을 받아 DB에 반영하고, 접속 중인 화면에 즉시 방송한다
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

    result = _apply(db=db, patient=patient, request=request)

    # 화면이 다시 물어보기(폴링)를 기다리지 않도록 값이 들어온 즉시 밀어준다.
    # heart_rate/resp_rate가 None이면 "이번엔 갱신할 값이 없음"이라는 뜻이라
    # 화면은 직전 값을 그대로 유지하고 재실/등급만 반영한다.
    # resp_replaced=True면 호흡은 이번에 잰 값이 아니라 직전 값을 이어 쓴 것이다.
    stream_service.publish(
        {
            "patient_id": patient.patient_id,
            "department_id": patient.department_id,
            "heart_rate": result["heart_rate"],
            "resp_rate": result["resp_rate"],
            "status": result["status"],
            "presence": result["presence"],
            "stabilizing": request.stabilizing,
            "saved": result["saved"],
            "resp_replaced": result["resp_replaced"],
            "measured_at": (request.measured_at or datetime.now()).isoformat(),
        }
    )

    return result


# 실제 판정·저장 로직 (방송은 위 ingest_vitals가 담당)
def _apply(
    db: Session,
    patient: Patient,
    request: VitalsIngestRequest,
) -> dict:

    # 재실 여부는 측정값이 없어도 항상 갱신한다
    vital_crud.update_presence(
        db=db,
        patient=patient,
        is_present=request.presence,
    )

    # 사람이 없거나, 센서가 아직 안정화 중(lock을 잡는 동안 값이 무의미)이면
    # 생체값을 건드리지 않고 마지막 정상값을 남겨둔다.
    if not request.presence or request.stabilizing:
        _buffers.pop(request.patient_id, None)
        return _not_saved(presence=request.presence)

    heart_rate = request.heart_rate
    resp_rate = request.breath_rate  # 하드웨어 breath_rate -> DB resp_rate

    # 심박은 등급 판정의 기준 신호다. 이걸 못 믿으면 이번 측정은 쓸 수 없다.
    if not _is_heart_rate_trustworthy(heart_rate):
        _buffers.pop(request.patient_id, None)
        return _not_saved(presence=True, rejected="no_heart_rate")

    # 호흡은 심박과 따로 판단한다. 레이더가 흉곽 움직임을 놓치는 일이 잦은데,
    # 그때마다 멀쩡한 심박까지 버리면 화면에 아무 값도 뜨지 않는다.
    resp_trusted = _is_resp_rate_trustworthy(
        heart_rate=heart_rate,
        resp_rate=resp_rate,
    )

    if not resp_trusted:
        previous = vital_crud.get_vital_check(db=db, patient_id=request.patient_id)

        if previous is None:
            # 이어 쓸 직전 호흡값조차 없으면 저장할 수가 없다
            # (vital_checks.resp_rate가 NOT NULL이라 빈 값을 넣을 수 없음)
            _buffers.pop(request.patient_id, None)
            return _not_saved(presence=True, rejected="no_resp_baseline")

        resp_rate = previous.resp_rate

    # 호흡을 못 믿을 때는 심박만으로 등급을 낸다.
    # 이어 쓴 옛날 호흡값으로 위험 판정을 내리면 가짜 응급이 만들어진다.
    vital_status = judge_status(
        heart_rate=heart_rate,
        resp_rate=resp_rate if resp_trusted else None,
    )

    vital_crud.upsert_vital_check(
        db=db,
        patient_id=request.patient_id,
        heart_rate=heart_rate,
        resp_rate=resp_rate,
        status=vital_status,
    )

    # 이어 쓴 호흡값은 이번에 측정된 값이 아니므로 1분 평균에 넣지 않는다
    if resp_trusted:
        _accumulate(
            db=db,
            patient_id=request.patient_id,
            heart_rate=heart_rate,
            resp_rate=resp_rate,
        )

    return {
        "saved": True,
        "presence": True,
        "status": vital_status.value,
        "heart_rate": heart_rate,
        "resp_rate": resp_rate,
        "resp_replaced": not resp_trusted,
    }


# 이번 측정을 저장하지 않을 때의 공통 응답.
# 심박/호흡을 None으로 돌려주면 화면은 직전 값을 그대로 유지한다.
def _not_saved(
    presence: bool,
    rejected: str | None = None,
) -> dict:

    result = {
        "saved": False,
        "presence": presence,
        "status": None,
        "heart_rate": None,
        "resp_rate": None,
        "resp_replaced": False,
    }

    if rejected is not None:
        result["rejected"] = rejected

    return result
