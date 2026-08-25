#!/usr/bin/env python3
"""
FinTrack AI - Dataset Validator

Validates the synthetic financial dataset for quality and consistency.
"""

import os
import sys
import json
import pandas as pd
import numpy as np
from typing import Dict, List


def validate_dataset(csv_path: str) -> Dict:
    """Run comprehensive validation on the dataset."""
    df = pd.read_csv(csv_path)
    report = {}

    # Basic stats
    report["total_records"] = len(df)
    report["num_users"] = df["user_id"].nunique() if "user_id" in df.columns else 0
    report["columns"] = list(df.columns)

    # Missing values
    missing = df.isnull().sum()
    report["missing_values"] = {col: int(v) for col, v in missing.items() if v > 0}
    report["missing_percentage"] = {col: round(v / len(df) * 100, 2) for col, v in missing.items() if v > 0}

    # Duplicate check
    if "transaction_id" in df.columns:
        dupes = df["transaction_id"].duplicated().sum()
        report["duplicate_transaction_ids"] = int(dupes)

    # Amount validation
    if "amount" in df.columns:
        report["amount_stats"] = {
            "mean": round(float(df["amount"].mean()), 2),
            "median": round(float(df["amount"].median()), 2),
            "min": round(float(df["amount"].min()), 2),
            "max": round(float(df["amount"].max()), 2),
            "std": round(float(df["amount"].std()), 2),
            "negative_count": int((df["amount"] < 0).sum()),
            "zero_count": int((df["amount"] == 0).sum()),
        }

    # Category distribution
    if "category" in df.columns:
        report["category_distribution"] = df["category"].value_counts().to_dict()

    # Transaction type distribution
    if "transaction_type" in df.columns:
        report["transaction_type_distribution"] = df["transaction_type"].value_counts().to_dict()

    # Payment method distribution
    if "payment_method" in df.columns:
        report["payment_method_distribution"] = df["payment_method"].value_counts().to_dict()

    # Date validation
    if "date" in df.columns:
        try:
            dates = pd.to_datetime(df["date"])
            report["date_range"] = {
                "min": str(dates.min()),
                "max": str(dates.max()),
            }
        except Exception:
            report["date_validation"] = "Invalid dates found"

    # Class balance check
    if "category" in df.columns and "transaction_type" in df.columns:
        expenses = df[df["transaction_type"] == "expense"]
        cat_counts = expenses["category"].value_counts()
        total = len(expenses)
        report["class_balance"] = {
            cat: {"count": int(count), "percentage": round(count / total * 100, 2)}
            for cat, count in cat_counts.items()
        }
        report["imbalance_ratio"] = round(cat_counts.max() / cat_counts.min(), 2) if cat_counts.min() > 0 else float("inf")

    # Outlier detection
    if "amount" in df.columns:
        q1 = df["amount"].quantile(0.25)
        q3 = df["amount"].quantile(0.75)
        iqr = q3 - q1
        outliers = df[(df["amount"] < q1 - 1.5 * iqr) | (df["amount"] > q3 + 1.5 * iqr)]
        report["outliers"] = {
            "count": len(outliers),
            "percentage": round(len(outliers) / len(df) * 100, 2),
            "upper_fence": round(float(q3 + 1.5 * iqr), 2),
            "lower_fence": round(float(max(0, q1 - 1.5 * iqr)), 2),
        }

    # Validation issues
    issues = []
    if report.get("duplicate_transaction_ids", 0) > 0:
        issues.append(f"Found {report['duplicate_transaction_ids']} duplicate transaction IDs")
    if report.get("amount_stats", {}).get("negative_count", 0) > 0:
        issues.append(f"Found {report['amount_stats']['negative_count']} negative amounts")
    if report.get("amount_stats", {}).get("zero_count", 0) > 0:
        issues.append(f"Found {report['amount_stats']['zero_count']} zero amounts")
    if report.get("imbalance_ratio", 0) > 10:
        issues.append(f"High class imbalance ratio: {report['imbalance_ratio']}")

    report["validation_issues"] = issues
    report["passed"] = len(issues) == 0

    return report


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, "datasets", "financial_transactions.csv")

    if not os.path.exists(csv_path):
        print(f"Dataset not found at {csv_path}")
        print("Run generate_dataset.py first.")
        sys.exit(1)

    print("Validating dataset...")
    report = validate_dataset(csv_path)

    # Save report
    report_path = os.path.join(script_dir, "datasets", "validation_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2, default=str)

    print(f"\n{'='*60}")
    print("DATASET VALIDATION REPORT")
    print(f"{'='*60}")
    print(f"Total Records: {report['total_records']}")
    print(f"Users: {report['num_users']}")
    print(f"Columns: {len(report['columns'])}")
    print(f"\nMissing Values: {len(report.get('missing_values', {}))} columns with gaps")
    print(f"Duplicate IDs: {report.get('duplicate_transaction_ids', 0)}")
    print(f"Outliers: {report.get('outliers', {}).get('count', 0)} ({report.get('outliers', {}).get('percentage', 0)}%)")

    if report.get("amount_stats"):
        print(f"\nAmount Stats:")
        for k, v in report["amount_stats"].items():
            print(f"  {k}: {v}")

    print(f"\nClass Imbalance Ratio: {report.get('imbalance_ratio', 'N/A')}")

    if report["validation_issues"]:
        print(f"\nIssues Found:")
        for issue in report["validation_issues"]:
            print(f"  ⚠ {issue}")
    else:
        print(f"\n✅ All checks passed!")

    print(f"\nReport saved to {report_path}")


if __name__ == "__main__":
    main()
