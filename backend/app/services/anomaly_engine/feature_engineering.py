"""Sliding-window feature extraction."""
from __future__ import annotations

from collections.abc import Iterator

import numpy as np
import pandas as pd

from app.services.anomaly_engine.config import Settings, settings

VITALS = ["heart_rate", "respiration_rate", "temperature"]
STAT_NAMES = ["mean", "std", "min", "max", "median", "delta", "slope", "recent10_mean", "change10"]


def feature_names() -> list[str]:
    names = [f"{vital}_{stat}" for vital in VITALS for stat in STAT_NAMES]
    names += [
        "motion_level_mean", "motion_level_max", "signal_quality_mean",
        "signal_quality_min", "missing_ratio", "presence_ratio",
    ]
    for vital in VITALS:
        names += [f"{vital}_baseline_diff", f"{vital}_baseline_zscore"]
    return names


def iter_windows(
    data: pd.DataFrame, config: Settings = settings, latest_only: bool = False,
) -> Iterator[pd.DataFrame]:
    """Yield fixed-duration windows by subject.

    latest_only=True면 가장 최근 윈도우 하나만 낸다. 실시간 판정에서는 매초
    "지금 상태"만 알면 되는데, 전부 계산하면 180초 버퍼 기준 25개 윈도우를
    만들고 그중 24개를 버리게 된다(1건에 260ms -> 초당 3.5건밖에 처리 못 함).
    학습할 때는 모든 윈도우가 필요하므로 기본값은 False로 둔다.
    """
    for _, group in data.groupby("subject_id"):
        group = group.sort_values("timestamp").reset_index(drop=True)
        size = config.window_seconds
        starts = range(0, len(group) - size + 1, config.window_step_seconds)

        if latest_only:
            starts = list(starts)[-1:]

        for start in starts:
            yield group.iloc[start:start + size].copy()


def _vital_features(values: pd.Series) -> dict[str, float]:
    valid = values.dropna()
    if valid.empty:
        return {name: np.nan for name in STAT_NAMES}
    x = np.arange(len(values))[values.notna().to_numpy()]
    slope = float(np.polyfit(x, valid.to_numpy(), 1)[0]) if len(valid) > 1 else 0.0
    recent = values.iloc[-10:].mean()
    previous = values.iloc[-20:-10].mean() if len(values) >= 20 else values.iloc[:10].mean()
    return {
        "mean": float(valid.mean()), "std": float(valid.std(ddof=0)),
        "min": float(valid.min()), "max": float(valid.max()), "median": float(valid.median()),
        "delta": float(valid.iloc[-1] - valid.iloc[0]), "slope": slope,
        "recent10_mean": float(recent), "change10": float(recent - previous),
    }


def extract_window_features(
    window: pd.DataFrame, baseline: dict[str, float],
) -> dict[str, float | str | pd.Timestamp | bool]:
    """Create model features plus rule-engine metadata for one window."""
    output: dict[str, float | str | pd.Timestamp | bool] = {
        "subject_id": str(window["subject_id"].iloc[0]),
        "window_start": window["timestamp"].iloc[0],
        "window_end": window["timestamp"].iloc[-1],
    }
    for vital in VITALS:
        stats = _vital_features(window[vital])
        output.update({f"{vital}_{name}": value for name, value in stats.items()})
    output.update({
        "motion_level_mean": float(window["motion_level"].mean()),
        "motion_level_max": float(window["motion_level"].max()),
        "signal_quality_mean": float(window["signal_quality"].mean()),
        "signal_quality_min": float(window["signal_quality"].min()),
        "missing_ratio": float(window["raw_missing_ratio"].mean()),
        "presence_ratio": float(window["presence"].mean()),
        "unrealistic_flag": bool(window["unrealistic_flag"].any()),
        "sample_count": float(len(window)),
    })
    for vital in VITALS:
        diff = float(output[f"{vital}_mean"]) - baseline[f"{vital}_mean"]
        output[f"{vital}_baseline_diff"] = diff
        output[f"{vital}_baseline_zscore"] = diff / baseline[f"{vital}_std"]
    return output


def extract_features(
    data: pd.DataFrame,
    baselines: dict[str, dict[str, float]],
    fallback: dict[str, float],
    config: Settings = settings,
    latest_only: bool = False,
) -> pd.DataFrame:
    rows = []
    for window in iter_windows(data, config, latest_only=latest_only):
        subject = str(window["subject_id"].iloc[0])
        rows.append(extract_window_features(window, baselines.get(subject, fallback)))
    return pd.DataFrame(rows)
