"""이상탐지 엔진 전용 설정.

smartcare_anomaly(코덱스 프로토타입)에서 가져온 값. 온도 센서는 쓰지 않기로
확정되어 있어(CLAUDE.md), temperature는 engine.py에서 항상 더미 상수(36.5)로
채워서 넣는다. 모델 구조(3개 vitals)는 그대로 유지한다.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parent


@dataclass(slots=True)
class ValueLimits:
    heart_rate: tuple[float, float] = (30.0, 220.0)
    respiration_rate: tuple[float, float] = (3.0, 60.0)
    temperature: tuple[float, float] = (20.0, 45.0)
    signal_quality: tuple[float, float] = (0.0, 1.0)
    motion_level: tuple[float, float] = (0.0, 1.0)


@dataclass(slots=True)
class Settings:
    window_seconds: int = int(os.getenv("ANOMALY_WINDOW_SECONDS", "60"))
    window_step_seconds: int = int(os.getenv("ANOMALY_WINDOW_STEP_SECONDS", "5"))
    interpolation_limit: int = int(os.getenv("ANOMALY_INTERPOLATION_LIMIT", "3"))
    contamination: float = float(os.getenv("ANOMALY_CONTAMINATION", "0.05"))
    random_state: int = int(os.getenv("ANOMALY_RANDOM_STATE", "42"))
    warning_threshold: float = float(os.getenv("ANOMALY_WARNING_THRESHOLD", "40"))
    anomaly_threshold: float = float(os.getenv("ANOMALY_ANOMALY_THRESHOLD", "70"))
    min_presence_ratio: float = float(os.getenv("ANOMALY_MIN_PRESENCE_RATIO", "0.8"))
    min_signal_quality: float = float(os.getenv("ANOMALY_MIN_SIGNAL_QUALITY", "0.5"))
    max_missing_ratio: float = float(os.getenv("ANOMALY_MAX_MISSING_RATIO", "0.2"))
    insufficient_missing_ratio: float = float(os.getenv("ANOMALY_INSUFFICIENT_MISSING_RATIO", "0.5"))
    min_window_coverage: float = float(os.getenv("ANOMALY_MIN_WINDOW_COVERAGE", "0.8"))
    model_version: str = os.getenv("ANOMALY_MODEL_VERSION", "isolation-forest-v1")
    artifact_path: Path = field(default_factory=lambda: Path(
        os.getenv("ANOMALY_MODEL_ARTIFACT_PATH", str(PACKAGE_ROOT / "artifacts" / "model.joblib"))
    ))
    limits: ValueLimits = field(default_factory=ValueLimits)


settings = Settings()
