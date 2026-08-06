"""Personal baseline calculation."""
from __future__ import annotations

import pandas as pd

VITALS = ["heart_rate", "respiration_rate", "temperature"]


def build_personal_baselines(data: pd.DataFrame) -> dict[str, dict[str, float]]:
    """Build robust per-subject mean/std baselines from present, usable rows."""
    usable = data[(data["presence"] > 0) & (~data["unrealistic_flag"])]
    baselines: dict[str, dict[str, float]] = {}
    for subject, group in usable.groupby("subject_id"):
        values: dict[str, float] = {}
        for column in VITALS:
            values[f"{column}_mean"] = float(group[column].mean())
            std = float(group[column].std(ddof=0))
            values[f"{column}_std"] = max(std, 0.1)
        baselines[str(subject)] = values
    return baselines


def global_baseline(data: pd.DataFrame) -> dict[str, float]:
    """Fallback baseline for a subject not seen during training."""
    result: dict[str, float] = {}
    for column in VITALS:
        result[f"{column}_mean"] = float(data[column].mean())
        result[f"{column}_std"] = max(float(data[column].std(ddof=0)), 0.1)
    return result
