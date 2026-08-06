"""Isolation Forest model persistence and calibrated scoring."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from app.services.anomaly_engine.config import Settings, settings
from app.services.anomaly_engine.feature_engineering import feature_names


class AnomalyDetector:
    """StandardScaler + normal-only Isolation Forest."""

    def __init__(self, config: Settings = settings) -> None:
        self.config = config
        self.scaler = StandardScaler()
        self.model = IsolationForest(
            n_estimators=250, contamination=config.contamination,
            random_state=config.random_state, n_jobs=1,
        )
        self.metadata: dict[str, Any] = {}
        self.score_low = 0.0
        self.score_high = 1.0
        self.is_fitted = False

    def fit(self, features: pd.DataFrame) -> None:
        x = features[feature_names()].replace([np.inf, -np.inf], np.nan)
        if x.isna().any().any():
            raise ValueError("Training features contain missing or infinite values")
        scaled = self.scaler.fit_transform(x)
        self.model.fit(scaled)
        raw = -self.model.score_samples(scaled)
        self.score_low = float(np.quantile(raw, 0.05))
        self.score_high = max(float(np.quantile(raw, 0.995)), self.score_low + 1e-6)
        self.metadata = {
            "model_version": self.config.model_version,
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "features": feature_names(),
            "contamination": self.config.contamination,
            "training_windows": len(features),
            "thresholds": {
                "warning": self.config.warning_threshold,
                "anomaly": self.config.anomaly_threshold,
            },
        }
        self.is_fitted = True

    def score(self, features: pd.DataFrame) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("Model is not fitted")
        scaled = self.scaler.transform(features[feature_names()])
        raw = -self.model.score_samples(scaled)
        score = 70.0 * (raw - self.score_low) / (self.score_high - self.score_low)
        return np.clip(score, 0.0, 100.0)

    def save(self, path: Path | None = None) -> Path:
        target = path or self.config.artifact_path
        target.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({
            "scaler": self.scaler, "model": self.model, "metadata": self.metadata,
            "score_low": self.score_low, "score_high": self.score_high,
        }, target)
        return target

    @classmethod
    def load(cls, path: Path | None = None, config: Settings = settings) -> "AnomalyDetector":
        target = path or config.artifact_path
        payload = joblib.load(target)
        instance = cls(config)
        instance.scaler = payload["scaler"]
        instance.model = payload["model"]
        instance.metadata = payload["metadata"]
        instance.score_low = payload["score_low"]
        instance.score_high = payload["score_high"]
        instance.is_fitted = True
        return instance
