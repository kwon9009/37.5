"""Cleaning, validation and one-second resampling."""
from __future__ import annotations

import numpy as np
import pandas as pd

from app.services.anomaly_engine.config import Settings, settings

REQUIRED_COLUMNS = [
    "timestamp", "subject_id", "heart_rate", "respiration_rate", "temperature",
    "motion_level", "signal_quality", "presence",
]
MEASURE_COLUMNS = [
    "heart_rate", "respiration_rate", "temperature", "motion_level", "signal_quality",
]


class SensorPreprocessor:
    """Preprocess each subject independently while retaining quality flags."""

    def __init__(self, config: Settings = settings) -> None:
        self.config = config

    def process(self, data: pd.DataFrame) -> pd.DataFrame:
        missing = set(REQUIRED_COLUMNS) - set(data.columns)
        if missing:
            raise ValueError(f"Missing columns: {sorted(missing)}")
        frame = data[REQUIRED_COLUMNS].copy()
        frame["timestamp"] = pd.to_datetime(frame["timestamp"], errors="coerce")
        if frame["timestamp"].isna().any():
            raise ValueError("timestamp contains invalid values")
        # 실시간 수집값은 정확히 1.000000초 간격이 아니라 datetime.now() 호출 시점의
        # 미세한 잔차(1.000117초, 1.000408초...)가 섞여 있다. 아래 _process_subject가
        # 1초 격자에 정확히 일치하는 timestamp만 남기고 나머지를 결측으로 처리하므로,
        # 반올림 없이 넘기면 거의 모든 행이 결측 처리되어 presence_ratio가 0에
        # 수렴하고 예측 모델이 상시 "데이터 부족"으로 빠진다. 초 단위로 반올림해
        # 실제 1초 간격 수집과 격자를 맞춘다.
        frame["timestamp"] = frame["timestamp"].dt.round("1s")
        for column in MEASURE_COLUMNS + ["presence"]:
            frame[column] = pd.to_numeric(frame[column], errors="coerce")
        frame = frame.sort_values(["subject_id", "timestamp"])
        frame = frame.drop_duplicates(["subject_id", "timestamp"], keep="last")
        parts = [self._process_subject(str(subject), group) for subject, group in frame.groupby("subject_id")]
        if not parts:
            return frame.assign(raw_missing_ratio=np.nan, unrealistic_flag=False)
        return pd.concat(parts, ignore_index=True)

    def _process_subject(self, subject_id: str, group: pd.DataFrame) -> pd.DataFrame:
        indexed = group.set_index("timestamp").sort_index()
        index = pd.date_range(indexed.index.min(), indexed.index.max(), freq="1s")
        indexed = indexed.reindex(index)
        indexed.index.name = "timestamp"
        indexed["subject_id"] = subject_id
        original_missing = indexed[MEASURE_COLUMNS].isna()
        indexed["raw_missing_ratio"] = original_missing.mean(axis=1)
        indexed["presence"] = indexed["presence"].ffill(limit=self.config.interpolation_limit)

        invalid = pd.Series(False, index=indexed.index)
        for column in MEASURE_COLUMNS:
            low, high = getattr(self.config.limits, column)
            bad = indexed[column].notna() & ~indexed[column].between(low, high)
            invalid |= bad
            indexed.loc[bad, column] = np.nan
        indexed["unrealistic_flag"] = invalid

        # Interpolate only short, interior gaps. Long gaps remain missing for rules.
        for column in MEASURE_COLUMNS:
            missing = indexed[column].isna()
            groups = missing.ne(missing.shift()).cumsum()
            lengths = groups.map(groups[missing].value_counts()).fillna(0)
            long_gap = missing & lengths.gt(self.config.interpolation_limit)
            filled = indexed[column].interpolate(method="time", limit_area="inside")
            indexed[column] = filled.mask(long_gap)
        indexed["presence"] = indexed["presence"].fillna(0).clip(0, 1)
        return indexed.reset_index()
