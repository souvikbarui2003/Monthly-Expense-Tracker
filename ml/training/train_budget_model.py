#!/usr/bin/env python3
"""
FinTrack AI - Budget Overrun Predictor

Predicts whether a user is likely to exceed their budget.
Uses classification with emphasis on recall and calibrated probabilities.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from typing import List, Dict

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score


def generate_budget_features(csv_path: str) -> pd.DataFrame:
    """Generate synthetic budget features from transaction data."""
    df = pd.read_csv(csv_path)
    df["date"] = pd.to_datetime(df["date"])
    df["month_key"] = df["date"].dt.to_period("M").astype(str)

    expenses = df[df["transaction_type"] == "expense"]

    # Monthly category spending
    monthly = expenses.groupby(["user_id", "month_key", "category"]).agg(
        total_spend=("amount", "sum"),
        tx_count=("amount", "count"),
        avg_spend=("amount", "mean"),
        max_spend=("amount", "max"),
    ).reset_index()

    # Add synthetic budget (1.2x median spending for that category)
    category_median = monthly.groupby("category")["total_spend"].median().to_dict()
    monthly["budget"] = monthly["category"].map(category_median) * 1.2

    # Feature engineering
    monthly["spend_ratio"] = monthly["total_spend"] / monthly["budget"]
    monthly["tx_intensity"] = monthly["tx_count"] / 30  # per day
    monthly["avg_to_max_ratio"] = monthly["avg_spend"] / (monthly["max_spend"] + 1)
    monthly["month_num"] = monthly["month_key"].apply(lambda x: int(x.split("-")[1]))

    # Determine overrun (target)
    monthly["overrun"] = (monthly["total_spend"] > monthly["budget"]).astype(int)

    # Add simulated time progression
    monthly["days_elapsed"] = np.random.randint(1, 30, len(monthly))
    monthly["days_remaining"] = 30 - monthly["days_elapsed"]
    monthly["time_progress"] = monthly["days_elapsed"] / 30
    monthly["spend_rate"] = monthly["total_spend"] / (monthly["days_elapsed"] + 1)
    monthly["projected_total"] = monthly["spend_rate"] * 30
    monthly["will_exceed_projected"] = (monthly["projected_total"] > monthly["budget"]).astype(int)

    return monthly


def train_and_evaluate(X_train, X_test, y_train, y_test) -> List[Dict]:
    """Train and evaluate classification models."""
    models = {
        "Logistic Regression": CalibratedClassifierCV(
            LogisticRegression(max_iter=1000, random_state=42), cv=3
        ),
        "Random Forest": CalibratedClassifierCV(
            RandomForestClassifier(n_estimators=200, max_depth=20, random_state=42, n_jobs=-1), cv=3
        ),
        "Gradient Boosting": CalibratedClassifierCV(
            GradientBoostingClassifier(n_estimators=200, max_depth=5, random_state=42), cv=3
        ),
    }

    results = []
    best_f1 = -1
    best_name = ""

    for name, model in models.items():
        print(f"\nTraining: {name}")
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)

        # Try to get ROC-AUC
        try:
            y_proba = model.predict_proba(X_test)[:, 1]
            roc = roc_auc_score(y_test, y_proba)
        except Exception:
            roc = 0.0

        print(f"  Accuracy:  {acc:.4f}")
        print(f"  Precision: {prec:.4f}")
        print(f"  Recall:    {rec:.4f}")
        print(f"  F1:        {f1:.4f}")
        print(f"  ROC-AUC:   {roc:.4f}")

        results.append({
            "model_name": name,
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(roc), 4),
        })

        if f1 > best_f1:
            best_f1 = f1
            best_name = name

    print(f"\nBEST: {best_name} (F1: {best_f1:.4f})")
    return results


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, "..", "data", "datasets")
    artifacts_dir = os.path.join(script_dir, "..", "artifacts")

    csv_path = os.path.join(data_dir, "financial_transactions.csv")
    if not os.path.exists(csv_path):
        print("Dataset not found. Run generate_dataset.py first.")
        sys.exit(1)

    print("Generating budget features...")
    df = generate_budget_features(csv_path)

    feature_cols = [
        "budget", "spend_ratio", "tx_count", "avg_spend", "max_spend",
        "days_elapsed", "days_remaining", "time_progress",
        "spend_rate", "projected_total", "will_exceed_projected",
        "tx_intensity", "avg_to_max_ratio", "month_num",
    ]

    X = df[feature_cols].values
    y = df["overrun"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"Train: {len(y_train)}, Test: {len(y_test)}")
    print(f"Overrun rate: {y.mean():.2%}")

    results = train_and_evaluate(X_train, X_test, y_train, y_test)

    best_result = max(results, key=lambda r: r["f1_score"])
    model_map = {
        "Logistic Regression": CalibratedClassifierCV(LogisticRegression(max_iter=1000, random_state=42), cv=3),
        "Random Forest": CalibratedClassifierCV(RandomForestClassifier(n_estimators=200, max_depth=20, random_state=42, n_jobs=-1), cv=3),
        "Gradient Boosting": CalibratedClassifierCV(GradientBoostingClassifier(n_estimators=200, max_depth=5, random_state=42), cv=3),
    }
    best_model = model_map[best_result["model_name"]]
    best_model.fit(X_train, y_train)

    os.makedirs(artifacts_dir, exist_ok=True)
    joblib.dump(best_model, os.path.join(artifacts_dir, "budget_predictor.joblib"))

    metadata = {
        "model_name": "budget_predictor",
        "version": "1.0.0",
        "trained_at": datetime.now().isoformat(),
        "model_type": best_result["model_name"],
        "features": feature_cols,
        "metrics": results,
    }
    with open(os.path.join(artifacts_dir, "budget_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print("\nArtifacts saved.")


if __name__ == "__main__":
    main()
