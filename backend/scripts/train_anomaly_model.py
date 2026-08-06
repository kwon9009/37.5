"""anomaly_engine용 모델 아티팩트를 학습해서 저장한다.

실행 (backend venv에서):
    venv\\Scripts\\python.exe scripts\\train_anomaly_model.py

이 프로젝트는 온도 센서를 쓰지 않기로 확정되어(CLAUDE.md), 학습 데이터의
temperature도 실제 운영 시 넣어줄 더미 상수(36.5)로 고정해서 만든다. 그래야
운영 중 "온도 변화 없음"이 모델 입장에서 정상으로 학습된 패턴이 된다.
"""
from __future__ import annotations

from pathlib import Path
import sys

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.services.anomaly_engine.prediction_service import train_detector  # noqa: E402

DUMMY_TEMPERATURE = 36.5


def generate_normal(
    duration_seconds: int = 3600,
    subject_ids: tuple[str, ...] = ("P001", "P002", "P003"),
    start: str = "2026-01-01T00:00:00",
    seed: int = 42,
) -> pd.DataFrame:
    """심박/호흡만 자연스럽게 흔들리는 정상 학습 데이터. 온도는 항상 더미 상수."""
    rng = np.random.default_rng(seed)
    frames = []
    for index, subject in enumerate(subject_ids):
        t = np.arange(duration_seconds)
        phase = index * 0.7
        heart = 70 + index * 4 + 4 * np.sin(t / 120 + phase) + rng.normal(0, 1.5, len(t))
        resp = 15 + index + 1.2 * np.sin(t / 150 + phase) + rng.normal(0, 0.45, len(t))
        motion = np.clip(rng.beta(1.2, 15, len(t)), 0, 1)
        quality = np.clip(0.96 - motion * 0.25 + rng.normal(0, 0.015, len(t)), 0.8, 1)
        frames.append(pd.DataFrame({
            "timestamp": pd.date_range(start, periods=len(t), freq="1s"),
            "subject_id": subject, "heart_rate": heart, "respiration_rate": resp,
            "temperature": DUMMY_TEMPERATURE, "motion_level": motion,
            "signal_quality": quality, "presence": 1,
        }))
    return pd.concat(frames, ignore_index=True)


def main() -> None:
    data = generate_normal()
    detector = train_detector(data)
    output = ROOT / "app" / "services" / "anomaly_engine" / "artifacts" / "model.joblib"
    detector.save(output)
    print(f"모델 저장 완료: {output}")
    print(detector.metadata)


if __name__ == "__main__":
    main()
