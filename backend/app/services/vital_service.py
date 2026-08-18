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
from app.crud import alert_crud, system_setting_crud, vital_crud
from app.models.enums import VitalStatus
from app.models.patient import Patient
from app.schemas.vitals.vitals_ingest_request import VitalsIngestRequest
from app.services import stream_service, vital_recorder
from app.services.anomaly_engine import engine as anomaly_engine

# 1분 평균을 만들기 위한 환자별 임시 버퍼 (서버 메모리)
_LOG_INTERVAL_SEC = 60
_buffers: dict[int, dict] = {}

# 조기경보 on/off, 응급 확정 지속시간은 매 측정마다(초당) DB를 안 찌르도록
# 이 안에서 잠깐 캐시해서 쓴다. 관리자가 바꾸면 최대 _SETTINGS_CACHE_SEC 뒤에 반영된다.
_SETTINGS_CACHE_SEC = 5.0
_settings_cache: dict = {"value": None, "loaded_at": 0.0}


def _get_settings(db: Session):
    now = time.time()

    if _settings_cache["value"] is None or now - _settings_cache["loaded_at"] > _SETTINGS_CACHE_SEC:
        _settings_cache["value"] = system_setting_crud.get_or_create(db=db)
        _settings_cache["loaded_at"] = now

    return _settings_cache["value"]

# 등급별 알림 문구 (NORMAL은 알림을 만들지 않는다)
_ALERT_MESSAGES = {
    VitalStatus.WARNING: "활력징후 주의가 감지되었습니다.",
    VitalStatus.ALERT: "의료진 확인이 필요합니다.",
    VitalStatus.DANGER: "응급상황이 감지되었습니다.",
}

# 등급 비교용 (숫자가 클수록 위험) - NEWS2와 예측 모델 중 더 위험한 쪽을 채택할 때 씀
_SEVERITY = {
    VitalStatus.NORMAL: 0,
    VitalStatus.WARNING: 1,
    VitalStatus.ALERT: 2,
    VitalStatus.DANGER: 3,
}

# 직전에 통보한 등급 (환자별). 등급이 "새로 바뀔 때"만 알림을 만들기 위한 기록.
_last_status: dict[int, VitalStatus] = {}

# 현재 진행 중인 DANGER 구간 (환자별). {"since": 시작시각, "notified": 통보했는지}
# DANGER가 끊기거나 사람이 자리를 비우면 지운다 = 처음부터 다시 센다.
_danger_episodes: dict[int, dict] = {}

# NEWS2 점수 -> 우리 등급
_SCORE_TO_STATUS = {
    0: VitalStatus.NORMAL,
    1: VitalStatus.WARNING,
    2: VitalStatus.ALERT,
    3: VitalStatus.DANGER,
}


# 심박수 NEWS2 점수
#   <=40:3  41~50:1  51~90:0  91~110:1  111~130:2  >=131:3
# 응급(danger_low/danger_high) 경계만 설정으로 움직일 수 있다. WARNING(41~50,
# 91~110)·ALERT(111~130) 구간은 NEWS2 표준 그대로 두되, danger 경계가 안쪽으로
# 좁혀 들어오면 그만큼 잘려나가도록 min/max로 물려서 구간이 겹치지 않게 한다.
def _heart_rate_score(heart_rate: int, danger_low: int, danger_high: int) -> int:

    if heart_rate <= danger_low or heart_rate >= danger_high:
        return 3

    if max(111, danger_low + 1) <= heart_rate <= min(130, danger_high - 1):
        return 2

    if (max(41, danger_low + 1) <= heart_rate <= 50) or (
        91 <= heart_rate <= min(110, danger_high - 1)
    ):
        return 1

    return 0


# 호흡수 NEWS2 점수
#   <=8:3  9~11:1  12~20:0  21~24:2  >=25:3
# 심박과 같은 방식으로 danger 경계만 조정 가능하다.
def _resp_rate_score(resp_rate: int, danger_low: int, danger_high: int) -> int:

    if resp_rate <= danger_low or resp_rate >= danger_high:
        return 3

    if max(21, danger_low + 1) <= resp_rate <= min(24, danger_high - 1):
        return 2

    if max(9, danger_low + 1) <= resp_rate <= 11:
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
    heart_rate_danger_low: int = 40,
    heart_rate_danger_high: int = 131,
    resp_rate_danger_low: int = 8,
    resp_rate_danger_high: int = 25,
) -> VitalStatus:

    score = _heart_rate_score(heart_rate, heart_rate_danger_low, heart_rate_danger_high)

    if resp_rate is not None:
        score = max(score, _resp_rate_score(resp_rate, resp_rate_danger_low, resp_rate_danger_high))

    return _SCORE_TO_STATUS[score]


# 예측 모델은 확정된 규칙 판정이 아니라 "평소와 다르다"는 조짐일 뿐이라, 모델
# 단독으로는 최대 ALERT(화면 "주의") 단계까지만 올린다 - 곧바로 DANGER(응급)로
# 표시하지 않는다. NEWS2가 자체적으로 낸 DANGER 판정은 이 상한선과 무관하게
# 그대로 유지된다(모델은 등급을 더하기만 하지, NEWS2 판정을 깎거나 막지 않는다).
_EARLY_WARNING_CEILING = VitalStatus.ALERT


# 라즈베리파이가 보낸 측정 시각을 그대로 믿어도 되는지 본다.
#
# RPi는 RTC(시계 배터리)가 없어서 부팅 직후 NTP 동기화 전까지 시각이 크게
# 틀어질 수 있다. 그 값을 그대로 모델 버퍼에 넣으면, 전처리가 버퍼의 처음~끝을
# 1초 격자로 채우면서 그 간격만큼 행을 만든다. 하루만 틀어져도 86,400행이라
# 서버가 멈춘다.
#
# 서버 시각과 너무 동떨어지면 못 믿는 것으로 보고 서버 시각을 쓴다(=예전 동작).
_MAX_CLOCK_SKEW_SEC = 300


def _usable_measured_at(measured_at: datetime | None) -> datetime | None:

    if measured_at is None:
        return None

    # 타임존이 붙어 온 경우 서버 시각(naive)과 뺄 수 없으므로 떼어낸다
    if measured_at.tzinfo is not None:
        measured_at = measured_at.replace(tzinfo=None)

    if abs((measured_at - datetime.now()).total_seconds()) > _MAX_CLOCK_SKEW_SEC:
        return None

    return measured_at


# NEWS2는 "지금 값이 고정 기준선을 넘었는가"만 본다. 여기서는 개인 평소 패턴(최근
# 180초) 대비 이상탐지 모델(anomaly_engine) 점수를 추가로 받아, NEWS2보다 더
# 위험하다고 나오면 그 등급으로 올려 쓴다. 반대로 모델이 더 낮게 보더라도 NEWS2
# 등급을 낮추지는 않는다(조기경보는 더하기만 하지, 기존 안전판을 약화하지 않는다).
def _apply_early_warning(
    news2_status: VitalStatus,
    patient_id: int,
    heart_rate: int,
    resp_rate: int,
    measured_at: datetime | None = None,
) -> tuple[VitalStatus, str | None, anomaly_engine.EvaluationResult]:

    # 측정 시각은 센서가 잰 시각(measured_at)을 쓴다. 안 넘기면 engine이 서버
    # 도착 시각을 찍는데, 그러면 전송이 밀렸다가 몰려 들어올 때 60초 윈도우가
    # 실제 측정 간격과 어긋난다.
    prediction = anomaly_engine.evaluate(
        patient_id=patient_id,
        heart_rate=heart_rate,
        respiration_rate=resp_rate,
        timestamp=_usable_measured_at(measured_at),
    )

    predicted_status = VitalStatus(prediction.status)

    if _SEVERITY[predicted_status] > _SEVERITY[_EARLY_WARNING_CEILING]:
        predicted_status = _EARLY_WARNING_CEILING

    # prediction은 상한을 적용하기 전의 원판정이다. 실측 기록에는 이걸 남겨야
    # "모델이 원래 얼마나 위험하다고 봤는지"를 나중에 되짚을 수 있다.
    if _SEVERITY[predicted_status] <= _SEVERITY[news2_status]:
        return news2_status, None, prediction

    reason = prediction.reasons[0] if prediction.reasons else None

    return predicted_status, reason, prediction


# 등급이 이전과 달라졌을 때만 알림을 만든다(매초 중복 생성 방지).
#
# DANGER는 곧바로 통보하지 않고 DANGER_SUSTAIN_SEC(기본 10초) 이상 이어질 때만
# 응급으로 본다. 센서가 한 번 튀어 1초만 DANGER가 나오는 일이 잦은데(실측상
# 호흡값이 1초 사이 6 이상 변하는 경우가 9.6%), 그때마다 응급으로 기록하면
# 나중에 웹푸시를 붙였을 때 보호자 폰이 헛되이 울린다.
#
# 지속 시간은 "몇 건 연속"이 아니라 "몇 초 지났나"로 잰다. 전송 주기가 흔들리거나
# 중간에 못 믿을 측정이 섞여도 기준이 함께 흔들리지 않게 하기 위함이다.
def _raise_alert_if_changed(
    db: Session,
    patient: Patient,
    status: VitalStatus,
    heart_rate: int,
    resp_rate: int,
    reason: str | None,
    now: float,
) -> None:

    patient_id = patient.patient_id
    previous_status = _last_status.get(patient_id)
    _last_status[patient_id] = status

    # DANGER가 아니면 진행 중이던 DANGER 구간은 끝난 것으로 본다
    if status != VitalStatus.DANGER:
        _danger_episodes.pop(patient_id, None)

        if status == VitalStatus.NORMAL or status == previous_status:
            return

        alert_crud.create_alert(
            db=db,
            patient_id=patient_id,
            department_id=patient.department_id,
            message=_ALERT_MESSAGES[status],
            status=status,
        )
        return

    # 여기부터 DANGER
    episode = _danger_episodes.get(patient_id)

    if episode is None:
        # 방금 시작했다. 아직 통보하지 않고 시각만 기록해둔다.
        _danger_episodes[patient_id] = {"since": now, "notified": False}
        return

    if episode["notified"]:
        # 이번 구간은 이미 통보했다. 이어지는 동안 중복으로 만들지 않는다.
        return

    if now - episode["since"] < _get_settings(db).danger_sustain_sec:
        # 아직 기준 시간을 못 채웠다.
        return

    episode["notified"] = True

    alert_crud.create_alert(
        db=db,
        patient_id=patient_id,
        department_id=patient.department_id,
        message=_ALERT_MESSAGES[status],
        status=status,
    )

    vital_crud.create_emergency_log(
        db=db,
        patient_id=patient_id,
        heart_rate=heart_rate,
        resp_rate=resp_rate,
        # 예측 모델이 올린 등급이면 그 사유를, 아니면 NEWS2(규칙) 판정임을 남긴다
        event_type=(reason or "NEWS2 규칙 기반 응급 감지")[:50],
    )
    # TODO: 웹푸시로 보호자에게 알림 발송 (3분 간격 최대 5회, 정상 복귀 시 중단)


# 심박을 믿을 수 있는가.
# 심박은 등급 판정의 기준 신호라, 이걸 못 믿으면 이번 측정은 쓸 수 없다.
def _is_heart_rate_trustworthy(heart_rate: int | None) -> bool:

    if heart_rate is None:
        return False

    return settings.PLAUSIBLE_HR_MIN <= heart_rate <= settings.PLAUSIBLE_HR_MAX


# 호흡만 위험 구간인데 심박이 멀쩡하면 센서 오류를 의심한다.
# 실제로 환자 상태가 나빠지면 심박·호흡이 함께 무너지므로,
# 호흡만 튀는 경우는 레이더가 흉곽 움직임을 놓친 것으로 보는 편이 안전하다.
def _is_resp_suspicious(
    heart_rate: int,
    resp_rate: int,
    heart_rate_danger_low: int,
    heart_rate_danger_high: int,
    resp_rate_danger_low: int,
    resp_rate_danger_high: int,
) -> bool:

    resp_score = _resp_rate_score(
        resp_rate, resp_rate_danger_low, resp_rate_danger_high
    )
    heart_score = _heart_rate_score(
        heart_rate, heart_rate_danger_low, heart_rate_danger_high
    )

    return resp_score == 3 and heart_score == 0


# 직전에 '믿은' 호흡값과 그 시각 (환자별). 급변 판정에만 쓴다.
_last_resp: dict[int, tuple[int, float]] = {}


# 직전에 믿었던 호흡값에서 1초 만에 크게 튀었는가.
# 사람의 호흡수는 그렇게 빨리 변하지 않는다. 레이더가 흉곽 대신 다른 움직임을
# 잡으면 18 -> 6 처럼 튀는데, 그대로 받으면 멀쩡한 사람이 갑자기
# '호흡 위험'으로 판정되어 가짜 응급이 발송된다.
def _is_resp_jump(
    patient_id: int,
    resp_rate: int,
    now: float,
) -> bool:

    previous = _last_resp.get(patient_id)

    if previous is None:
        return False

    value, measured_at = previous

    # 신호가 한참 끊겼다 다시 잡힌 경우는 급변이 아니라 재측정으로 본다
    if now - measured_at > settings.RESP_JUMP_WINDOW_SEC:
        return False

    return abs(resp_rate - value) >= settings.RESP_MAX_JUMP


# 호흡을 믿을 수 있는가. 심박과 별개로 판단한다.
# patient_id/now를 주면 직전 값 대비 급변까지 검사한다.
def _is_resp_rate_trustworthy(
    heart_rate: int,
    resp_rate: int | None,
    heart_rate_danger_low: int,
    heart_rate_danger_high: int,
    resp_rate_danger_low: int,
    resp_rate_danger_high: int,
    patient_id: int | None = None,
    now: float | None = None,
) -> bool:

    if resp_rate is None:
        return False

    if not (settings.PLAUSIBLE_RR_MIN <= resp_rate <= settings.PLAUSIBLE_RR_MAX):
        return False

    if _is_resp_suspicious(
        heart_rate=heart_rate,
        resp_rate=resp_rate,
        heart_rate_danger_low=heart_rate_danger_low,
        heart_rate_danger_high=heart_rate_danger_high,
        resp_rate_danger_low=resp_rate_danger_low,
        resp_rate_danger_high=resp_rate_danger_high,
    ):
        return False

    if patient_id is not None and now is not None:
        return not _is_resp_jump(
            patient_id=patient_id,
            resp_rate=resp_rate,
            now=now,
        )

    return True


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

    # 실측 세션 기록 (VITAL_RECORD_PATH를 설정했을 때만).
    # 1초 원시값은 DB에 남지 않으므로, 규칙 판정과 모델 판정을 나중에 비교하려면
    # 여기서 남겨두는 수밖에 없다.
    if vital_recorder.is_enabled():
        vital_recorder.record(
            vital_recorder.build_entry(
                patient_id=request.patient_id,
                request_heart_rate=request.heart_rate,
                request_resp_rate=request.breath_rate,
                presence=request.presence,
                stabilizing=request.stabilizing,
                measured_at=request.measured_at,
                result=result,
            )
        )

    # 판정 비교용 값은 기록에만 쓴다. 화면·하드웨어 응답에는 내보내지 않는다.
    for key in ("news2", "model", "score", "reasons"):
        result.pop(key, None)

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
            "early_warning": result.get("reason"),
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
        # 자리를 비웠거나 센서가 안정화 중이면 그동안은 지켜보지 못한 것이므로,
        # 진행 중이던 DANGER 지속 시간도 무효로 하고 처음부터 다시 센다.
        # ("재실 상태가 유지되면서 10초 이상"이 응급 판정 조건이다)
        _danger_episodes.pop(request.patient_id, None)
        return _not_saved(presence=request.presence)

    heart_rate = request.heart_rate
    resp_rate = request.breath_rate  # 하드웨어 breath_rate -> DB resp_rate

    # 심박은 등급 판정의 기준 신호다. 이걸 못 믿으면 이번 측정은 쓸 수 없다.
    if not _is_heart_rate_trustworthy(heart_rate):
        _buffers.pop(request.patient_id, None)
        return _not_saved(presence=True, rejected="no_heart_rate")

    # 호흡은 심박과 따로 판단한다. 레이더가 흉곽 움직임을 놓치는 일이 잦은데,
    # 그때마다 멀쩡한 심박까지 버리면 화면에 아무 값도 뜨지 않는다.
    now = time.time()
    # 경계값은 호흡 신뢰 판정에서도 쓰므로 여기서 미리 읽는다
    current_settings = _get_settings(db)
    resp_trusted = _is_resp_rate_trustworthy(
        heart_rate=heart_rate,
        resp_rate=resp_rate,
        heart_rate_danger_low=current_settings.heart_rate_danger_low,
        heart_rate_danger_high=current_settings.heart_rate_danger_high,
        resp_rate_danger_low=current_settings.resp_rate_danger_low,
        resp_rate_danger_high=current_settings.resp_rate_danger_high,
        patient_id=request.patient_id,
        now=now,
    )

    if resp_trusted:
        _last_resp[request.patient_id] = (resp_rate, now)

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
    news2_status = judge_status(
        heart_rate=heart_rate,
        resp_rate=resp_rate if resp_trusted else None,
        heart_rate_danger_low=current_settings.heart_rate_danger_low,
        heart_rate_danger_high=current_settings.heart_rate_danger_high,
        resp_rate_danger_low=current_settings.resp_rate_danger_low,
        resp_rate_danger_high=current_settings.resp_rate_danger_high,
    )
    vital_status = news2_status

    # 예측 모델(anomaly_engine)은 개인 평소 패턴 대비 이상 정도를 본다. 호흡을
    # 못 믿는 이번 측정에 옛날 호흡값을 넣어 모델에 태우면 잘못된 학습/판정이
    # 나오므로, 심박·호흡이 둘 다 이번에 실제로 믿을 수 있을 때만 돌린다.
    reason = None
    prediction = None
    if current_settings.early_warning_enabled and resp_trusted:
        vital_status, reason, prediction = _apply_early_warning(
            news2_status=news2_status,
            patient_id=request.patient_id,
            heart_rate=heart_rate,
            resp_rate=resp_rate,
            measured_at=request.measured_at,
        )

    vital_crud.upsert_vital_check(
        db=db,
        patient_id=request.patient_id,
        heart_rate=heart_rate,
        resp_rate=resp_rate,
        status=vital_status,
    )

    _raise_alert_if_changed(
        db=db,
        patient=patient,
        status=vital_status,
        heart_rate=heart_rate,
        resp_rate=resp_rate,
        reason=reason,
        now=now,
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
        "reason": reason,
        # 아래 넷은 화면에는 안 나가고 실측 기록에만 쓴다.
        # 규칙 판정과 모델 판정을 나란히 남겨야 나중에 둘을 비교할 수 있다.
        "news2": news2_status.value,
        "model": prediction.status if prediction else None,
        "score": prediction.anomaly_score if prediction else None,
        "reasons": prediction.reasons if prediction else None,
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
