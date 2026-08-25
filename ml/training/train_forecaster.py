#!/usr/bin/env python3
"""
FinTrack AI - Spending Forecaster

Trains and evaluates models for predicting monthly spending by category.
Models: Linear Regression, Random Forest, Gradient Boosting
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Tuple, List

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def load_and_prepare(csv_path: str) -> pd.DataFrame:
    """Load data and create monthly aggregations per user."""
    df = pd.read_csv(csv_path)
    df["date"] = pd.to_datetime(df["date"])
    df["month_key"] = df["date"].dt.to_period("M").astype(str)

    # Focus on expenses
    expenses = df[df["transaction_type"] == "expense"].copy()

    # Monthly user-category aggregations
    monthly = expenses.groupby(["user_id", "month_key", "category"]).agg(
        total_amount=("amount", "sum"),
        transaction_count=("amount", "count"),
        avg_amount=("amount", "mean"),
        median_amount=("amount", "median"),
    ).reset_index()

    return monthly


def create_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create features for forecasting."""
    # Previous month spending (lag features)
    df = df.sort_values(["user_id", "category", "month_key"])
    df["prev_month_spend"] = df.groupby(["user_id", "category"])["total_amount"].shift(1)
    df["prev_2month_spend"] = df.groupby(["user_id", "category"])["total_amount"].shift(2)
    df["prev_3month_spend"] = df.groupby(["user_id", "category"])["total_amount"].shift(3)

    # Rolling averages
    df["rolling_3m_avg"] = df.groupby(["user_id", "category"])["total_amount"].transform(
        lambda x: x.rolling(3, min_periods=1).mean()
    )
    df["rolling_6m_avg"] = df.groupby(["user_id", "category"])["total_amount"].transform(
        lambda x: x.rolling(6, min_periods=1).mean()
    )

    # Rolling std (volatility)
    df["rolling_3m_std"] = df.groupby(["user_id", "category"])["total_amount"].transform(
        lambda x: x.rolling(3, min_periods=1).std().fillna(0)
    )

    # Month of year (seasonality)
    df["month_num"] = df["month_key"].apply(lambda x: int(x.split("-")[1]))

    # Days in month approximation
    df["tx_count_prev"] = df.groupby(["user_id", "category"])["transaction_count"].shift(1)

    # Fill NaN
    df = df.fillna(0)

    return df


def train_and_evaluate(X_train, X_test, y_train, y_test) -> List[Dict]:
    """Train and evaluate regression models."""
    models = {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(
            n_estimators=200, max_depth=20, min_samples_split=5, random_state=42, n_jobs=-1,
        ),
        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=200, max_depth=5, learning_rate=0.1, random_state=42,
        ),
    }

    results = []
    best_r2 = -999
    best_name = ""

    for name, model in models.items():
        print(f"\nTraining: {name}")
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)

        print(f"  MAE:  ₹{mae:.2f}")
        print(f"  RMSE: ₹{rmse:.2f}")
        print(f"  R²:   {r2:.4f}")

        results.append({
            "model_name": name,
            "mae": round(float(mae), 2),
            "rmse": round(float(rmse), 2),
            "r2_score": round(float(r2), 4),
            "train_size": len(y_train),
            "test_size": len(y_test),
        })

        if r2 > best_r2:
            best_r2 = r2
            best_name = name

    print(f"\nBEST: {best_name} (R²: {best_r2:.4f})")
    return results


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, "..", "data", "datasets")
    artifacts_dir = os.path.join(script_dir, "..", "artifacts")

    csv_path = os.path.join(data_dir, "financial_transactions.csv")
    if not os.path.exists(csv_path):
        print("Dataset not found. Run generate_dataset.py first.")
        sys.exit(1)

    print("Loading and preparing data...")
    df = load_and_prepare(csv_path)
    df = create_features(df)

    feature_cols = [
        "prev_month_spend", "prev_2month_spend", "prev_3month_spend",
        "rolling_3m_avg", "rolling_6m_avg", "rolling_3m_std",
        "transaction_count", "avg_amount", "median_amount",
        "month_num", "tx_count_prev",
    ]

    X = df[feature_cols].values
    y = df["total_amount"].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print(f"Train: {len(y_train)}, Test: {len(y_test)}")

    results = train_and_evaluate(X_train, X_test, y_train, y_test)

    # Train best model
    best_result = max(results, key=lambda r: r["r2_score"])
    model_map = {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(n_estimators=200, max_depth=20, random_state=42, n_jobs=-1),
        "Gradient Boosting": GradientBoostingRegressor(n_estimators=200, max_depth=5, random_state=42),
    }
    best_model = model_map[best_result["model_name"]]
    best_model.fit(X_train, y_train)

    # Save
    os.makedirs(artifacts_dir, exist_ok=True)
    joblib.dump(best_model, os.path.join(artifacts_dir, "spending_forecaster.joblib"))

    metadata = {
        "model_name": "spending_forecaster",
        "version": "1.0.0",
        "trained_at": datetime.now().isoformat(),
        "model_type": best_result["model_name"],
        "features": feature_cols,
        "metrics": results,
    }
    with open(os.path.join(artifacts_dir, "forecaster_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print("\nArtifacts saved.")


if __name__ == "__main__":
    main()
