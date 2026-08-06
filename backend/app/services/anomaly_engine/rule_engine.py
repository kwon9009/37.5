"""Priority rules and human-readable explanations."""
from __future__ import annotations

import math
from typing import Any

from app.services.anomaly_engine.config import Settings, settings


def priority_status(row: dict[str, Any], config: Settings = settings) -> tuple[str | None, list[str]]:
    """Return an overriding status before consulting the ML score."""
    if row["sample_count"] < config.window_seconds * config.min_window_coverage:
        return "insufficient_data", ["not enough samples for a 60-second window"]
    if row["presence_ratio"] < config.min_presence_ratio:
        return "insufficient_data", ["person was not present for enough of the window"]
    quality = row["signal_quality_min"]
    if not math.isfinite(quality) or quality < config.min_signal_quality:
        return "sensor_error", ["signal quality fell below the configured minimum"]
    if row["missing_ratio"] >= config.insufficient_missing_ratio:
        return "insufficient_data", ["too much sensor data is missing"]
    if row["missing_ratio"] > config.max_missing_ratio:
        return "sensor_error", ["sensor data missing ratio is too high"]
    if row["unrealistic_flag"]:
        return "sensor_error", ["sensor reported a physiologically unrealistic value"]
    return None, []


def explain(row: dict[str, Any]) -> list[str]:
    """Explain departures using baseline z-scores, changes and trends.

    temperature는 하드웨어 결정상 더미 상수로 채워 넣기 때문에 baseline diff가
    항상 0에 가까워 여기서 실질적으로 트리거되지 않는다.
    """
    reasons: list[str] = []
    labels = {
        "heart_rate": "heart rate", "respiration_rate": "respiration rate",
        "temperature": "temperature",
    }
    for vital, label in labels.items():
        z = float(row[f"{vital}_baseline_zscore"])
        if abs(z) >= 2.0:
            direction = "above" if z > 0 else "below"
            reasons.append(f"{label} is {direction} the personal baseline ({abs(z):.1f} SD)")
        change = float(row[f"{vital}_change10"])
        limit = {"heart_rate": 8.0, "respiration_rate": 4.0, "temperature": 0.5}[vital]
        if abs(change) >= limit:
            direction = "increased" if change > 0 else "decreased"
            reasons.append(f"{label} {direction} in the most recent 10 seconds")
        slope = float(row[f"{vital}_slope"])
        slope_limit = {"heart_rate": 0.25, "respiration_rate": 0.12, "temperature": 0.02}[vital]
        if abs(slope) >= slope_limit:
            direction = "upward" if slope > 0 else "downward"
            reasons.append(f"{label} shows a {direction} trend")
    if float(row["motion_level_mean"]) > 0.5:
        reasons.append("high motion may affect radar measurements")
    return reasons[:6]


def classify_score(score: float, config: Settings = settings) -> str:
    if score >= config.anomaly_threshold:
        return "anomaly"
    if score >= config.warning_threshold:
        return "warning"
    return "normal"
