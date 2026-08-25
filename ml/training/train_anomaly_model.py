#!/usr/bin/env python3
"""
FinTrack AI - Anomaly Detector

Trains Isolation Forest for detecting unusual transactions.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Tuple

from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


def prepare_features(csv_path: str) -> pd.DataFrame:
    """Prepare features for anomaly detection."""
    df = pd.read_csv(csv_path)
    df["date"] = pd.to_datetime(df["date"])

    expenses = df[df["transaction_type"] == "expense"].copy()

    # Per-user statistics
    user_stats = expenses.groupby("user_id")["amount"].agg(["mean", "std", "median"]).reset_index()
    user_stats.columns = ["user_id", "user_mean", "user_std", "user_median"]

    expenses = expenses.merge(user_stats, on="user_id", how="left")

    # Features for anomaly detection
    expenses["amount_zscore"] = (expenses["amount"] - expenses["user_mean"]) / (expenses["user_std"] + 1)
    expenses["amount_to_median"] = expenses["amount"] / (expenses["user_median"] + 1)
    expenses["day_of_month"] = expenses["date"].dt.day
    expenses["day_of_week"] = expenses["date"].dt.dayofweek
    expenses["is_weekend"] = (expenses["day_of_week"] >= 5).astype(int)
    expenses["month"] = expenses["date"].dt.month

    # User category spending
    cat_stats = expenses.groupby(["user_id", "category"])["amount"].agg(["mean", "std"]).reset_index()
    cat_stats.columns = ["user_id", "category", "cat_mean", "cat_std"]
    expenses = expenses.merge(cat_stats, on=["user_id", "category"], how="left")
    expenses["cat_zscore"] = (expenses["amount"] - expenses["cat_mean"]) / (expenses["cat_std"] + 1)

    expenses = expenses.fillna(0)

    return expenses


def train_anomaly_detector(df: pd.DataFrame) -> Tuple[IsolationForest, StandardScaler, Dict]:
    """Train Isolation Forest anomaly detector."""
    feature_cols = [
        "amount", "amount_zscore", "amount_to_median",
        "day_of_month", "day_of_week", "is_weekend", "month",
        "cat_zscore",
    ]

    X = df[feature_cols].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train Isolation Forest
    model = IsolationForest(
        n_estimators=200,
        contamination=0.05,  # Expect ~5% anomalies
        max_samples="auto",
        random_state=42,
        n_jobs=-1,
    )

    model.fit(X_scaled)

    # Get predictions
    predictions = model.predict(X_scaled)
    scores = model.score_samples(X_scaled)

    n_anomalies = (predictions == -1).sum()
    n_normal = (predictions == 1).sum()

    metrics = {
        "total_transactions": len(df),
        "anomalies_detected": int(n_anomalies),
        "normal_transactions": int(n_normal),
        "anomaly_rate": round(n_anomalies / len(df), 4),
        "avg_anomaly_score": round(float(scores[predictions == -1].mean()), 4) if n_anomalies > 0 else 0,
        "avg_normal_score": round(float(scores[predictions == 1].mean()), 4) if n_normal > 0 else 0,
        "feature_columns": feature_cols,
    }

    print(f"Anomalies detected: {n_anomalies} ({metrics['anomaly_rate']:.2%})")
    print(f"Avg anomaly score: {metrics['avg_anomaly_score']:.4f}")
    print(f"Avg normal score: {metrics['avg_normal_score']:.4f}")

    return model, scaler, metrics


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, "..", "data", "datasets")
    artifacts_dir = os.path.join(script_dir, "..", "artifacts")

    csv_path = os.path.join(data_dir, "financial_transactions.csv")
    if not os.path.exists(csv_path):
        print("Dataset not found. Run generate_dataset.py first.")
        sys.exit(1)

    print("Preparing features...")
    df = prepare_features(csv_path)

    print(f"Data shape: {df.shape}")

    print("\nTraining Isolation Forest...")
    model, scaler, metrics = train_anomaly_detector(df)

    # Save
    os.makedirs(artifacts_dir, exist_ok=True)
    joblib.dump(model, os.path.join(artifacts_dir, "anomaly_detector.joblib"))
    joblib.dump(scaler, os.path.join(artifacts_dir, "anomaly_scaler.joblib"))

    metadata = {
        "model_name": "anomaly_detector",
        "version": "1.0.0",
        "trained_at": datetime.now().isoformat(),
        "model_type": "IsolationForest",
        "contamination": 0.05,
        "n_estimators": 200,
        "metrics": metrics,
    }
    with open(os.path.join(artifacts_dir, "anomaly_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print("\nArtifacts saved.")


if __name__ == "__main__":
    main()
