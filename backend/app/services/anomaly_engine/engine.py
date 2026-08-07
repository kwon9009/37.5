"""실시간 이상탐지 엔진 진입점.

ingestion(수집) 계층은 이 모듈의 evaluate()만 호출하면 된다.
- 버퍼(최근 최대 180초 원시값)에 새 reading을 넣고
- 60초가 안 쌓였으면 간단 임계값(fallback)으로 4단계 상태를 반환
- 60초 이상 쌓였으면 smartcare_anomaly IsolationForest 모델로 점수/사유를 계산해
  그 점수를 4단계(NORMAL/WARNING/ALERT/DANGER)로 재매핑해서 반환

온도 센서는 이 프로젝트에서 쓰지 않기로 확정되어 있어(CLAUDE.md), 모델이 기대하는
temperature 입력은 항상 더미 상수로 채운다. motion_level/signal_quality/presence도
현재 하드웨어가 아직 보내주지 않으므로 임시 기본값을 쓴다.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from threading import Lock

from app.services.anomaly_engine.buffer import VitalBuffer
from app.services.anomaly_engine.config import settings
from app.services.anomaly_engine.detector import AnomalyDetector
from app.services.anomaly_engine.prediction_service import PredictionService

# 하드웨어가 아직 보내주지 않는 값들의 임시 기본값
DUMMY_TEMPERATURE = 36.5
DEFAULT_MOTION_LEVEL = 0.0
DEFAULT_SIGNAL_QUALITY = 1.0
DEFAULT_PRESENCE = 1

_buffer = VitalBuffer(maxlen=180)
_lock = Lock()
_detector: AnomalyDetector | None = None
_load_attempted = False


@dataclass
class EvaluationResult:
    status: str  # "NORMAL" | "WARNING" | "ALERT" | "DANGER"
    reasons: list[str] = field(default_factory=list)
    anomaly_score: float | None = None


def _get_detector() -> AnomalyDetector | None:
    global _detector, _load_attempted
    with _lock:
        if _detector is None and not _load_attempted:
            _load_attempted = True
            if settings.artifact_path.exists():
                _detector = AnomalyDetector.load()
    return _detector


def _fallback_status(heart_rate: float, respiration_rate: float) -> EvaluationResult:
    """60초 윈도우가 아직 안 쌓였을 때 쓰는 임시 임계값 판정 (seed.py 범위와 동일한 기준)."""
    if heart_rate >= 135 or heart_rate < 40 or respiration_rate >= 29 or respiration_rate < 8:
        return EvaluationResult("DANGER", ["데이터 수집 중 · 심박/호흡이 위험 범위입니다"])
    if heart_rate >= 110 or respiration_rate >= 23:
        return EvaluationResult("ALERT", ["데이터 수집 중 · 심박/호흡이 경고 범위입니다"])
    if heart_rate >= 90 or respiration_rate >= 19:
        return EvaluationResult("WARNING", ["데이터 수집 중 · 심박/호흡이 다소 높습니다"])
    return EvaluationResult("NORMAL")


def _bucket_score(score: float) -> str:
    """모델의 0~100 anomaly_score를 4단계 VitalStatus로 재매핑."""
    if score >= 80:
        return "DANGER"
    if score >= 60:
        return "ALERT"
    if score >= 40:
        return "WARNING"
    return "NORMAL"


def evaluate(
    patient_id: int, heart_rate: float, respiration_rate: float, timestamp: datetime | None = None,
) -> EvaluationResult:
    key = str(patient_id)
    reading = {
        "timestamp": timestamp or datetime.now(),
        "subject_id": key,
        "heart_rate": heart_rate,
        "respiration_rate": respiration_rate,
        "temperature": DUMMY_TEMPERATURE,
        "motion_level": DEFAULT_MOTION_LEVEL,
        "signal_quality": DEFAULT_SIGNAL_QUALITY,
        "presence": DEFAULT_PRESENCE,
    }
    _buffer.push(key, reading)
    frame = _buffer.get_dataframe(key)

    detector = _get_detector()
    if detector is None or len(frame) < settings.window_seconds:
        return _fallback_status(heart_rate, respiration_rate)

    # 매초 판정에서는 "지금 상태"만 필요하다. 전체 윈도우를 다 계산하면
    # 24개를 만들어 버리게 되므로 마지막 하나만 계산한다.
    outputs = PredictionService(detector).predict(frame, latest_only=True)
    latest = outputs[-1]
    status = latest["status"]

    if status == "insufficient_data":
        return _fallback_status(heart_rate, respiration_rate)
    if status == "sensor_error":
        return EvaluationResult("WARNING", latest["reasons"])

    score = latest["anomaly_score"] or 0.0
    return EvaluationResult(_bucket_score(score), latest["reasons"], score)


def get_recent_heart_rates(patient_id: int, limit: int = 30) -> list[float]:
    """대시보드 스파크라인용: 버퍼에 쌓인 최근 원시 심박값(최대 limit개)."""
    frame = _buffer.get_dataframe(str(patient_id))
    if frame.empty:
        return []
    return [round(float(v), 1) for v in frame["heart_rate"].tail(limit)]


def get_recent_respiration_rates(patient_id: int, limit: int = 30) -> list[float]:
    """환자 상세 페이지 추이 그래프용: 버퍼에 쌓인 최근 원시 호흡값(최대 limit개)."""
    frame = _buffer.get_dataframe(str(patient_id))
    if frame.empty:
        return []
    return [round(float(v), 1) for v in frame["respiration_rate"].tail(limit)]
