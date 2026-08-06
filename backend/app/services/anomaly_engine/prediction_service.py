"""Training and inference orchestration, independent of transport."""
from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from app.services.anomaly_engine.config import Settings, settings
from app.services.anomaly_engine.detector import AnomalyDetector
from app.services.anomaly_engine.baseline import build_personal_baselines, global_baseline
from app.services.anomaly_engine.feature_engineering import extract_features, feature_names
from app.services.anomaly_engine.preprocessing import SensorPreprocessor
from app.services.anomaly_engine.rule_engine import classify_score, explain, priority_status


def train_detector(data: pd.DataFrame, config: Settings = settings) -> AnomalyDetector:
    """Train on normal, present, valid windows and retain personal baselines."""
    processed = SensorPreprocessor(config).process(data)
    baselines = build_personal_baselines(processed)
    fallback = global_baseline(processed)
    features = extract_features(processed, baselines, fallback, config)
    trainable = features[
        (features["presence_ratio"] >= config.min_presence_ratio)
        & (features["signal_quality_min"] >= config.min_signal_quality)
        & (features["missing_ratio"] <= config.max_missing_ratio)
        & (~features["unrealistic_flag"])
    ].dropna(subset=feature_names())
    if len(trainable) < 20:
        raise ValueError("At least 20 valid normal windows are required for training")
    detector = AnomalyDetector(config)
    detector.fit(trainable)
    detector.metadata["baselines"] = baselines
    detector.metadata["global_baseline"] = fallback
    return detector


class PredictionService:
    """Run preprocessing, rules, model scoring and explanations."""

    def __init__(self, detector: AnomalyDetector, config: Settings = settings) -> None:
        self.detector = detector
        self.config = config

    def predict(self, data: pd.DataFrame) -> list[dict[str, Any]]:
        processed = SensorPreprocessor(self.config).process(data)
        fallback = self.detector.metadata["global_baseline"]
        features = extract_features(
            processed, self.detector.metadata.get("baselines", {}), fallback, self.config
        )
        if features.empty:
            subject = str(data["subject_id"].iloc[0]) if len(data) else "unknown"
            start = pd.to_datetime(data["timestamp"]).min()
            end = pd.to_datetime(data["timestamp"]).max()
            return [self._response(subject, start, end, "insufficient_data", None,
                                   ["fewer than 60 seconds of data"], None)]
        outputs = []
        for _, series in features.iterrows():
            row = series.to_dict()
            override, reasons = priority_status(row, self.config)
            score: float | None = None
            if override is None:
                values = pd.DataFrame([{name: row[name] for name in feature_names()}])
                if values.replace([np.inf, -np.inf], np.nan).isna().any().any():
                    override, reasons = "insufficient_data", ["required window features are missing"]
                else:
                    score = round(float(self.detector.score(values)[0]), 1)
                    override = classify_score(score, self.config)
                    reasons = explain(row)
                    if override != "normal" and not reasons:
                        reasons = ["multivariate pattern differs from learned normal windows"]
            outputs.append(self._response(
                row["subject_id"], row["window_start"], row["window_end"], override,
                score, reasons, row["signal_quality_mean"],
            ))
        return outputs

    def _response(
        self, subject: str, start: Any, end: Any, status: str, score: float | None,
        reasons: list[str], quality: float | None,
    ) -> dict[str, Any]:
        return {
            "subject_id": subject, "window_start": pd.Timestamp(start).to_pydatetime(),
            "window_end": pd.Timestamp(end).to_pydatetime(), "status": status,
            "anomaly_score": score, "reasons": reasons,
            "signal_quality": None if quality is None or np.isnan(quality) else round(float(quality), 3),
            "model_version": self.detector.metadata.get("model_version", self.config.model_version),
        }
