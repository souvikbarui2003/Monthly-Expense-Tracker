#!/usr/bin/env python3
"""
FinTrack AI - Expense Category Classifier

Trains and evaluates multiple ML models for automatic expense categorization.
Models: Logistic Regression, Linear SVM, Random Forest
Features: TF-IDF on transaction descriptions
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Tuple, List

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix
)
from sklearn.calibration import CalibratedClassifierCV


def load_dataset(csv_path: str) -> pd.DataFrame:
    """Load and preprocess the transaction dataset."""
    df = pd.read_csv(csv_path)

    # Filter to expenses only (for categorization)
    df = df[df["transaction_type"] == "expense"].copy()

    # Drop rows with missing descriptions
    df = df.dropna(subset=["description", "category"])

    # Combine description and merchant for richer features
    df["text"] = df["description"].fillna("") + " " + df["merchant"].fillna("")

    print(f"Loaded {len(df)} expense records")
    print(f"Categories: {df['category'].nunique()}")
    print(f"\nCategory distribution:")
    print(df["category"].value_counts())

    return df


def prepare_features(df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, TfidfVectorizer, LabelEncoder]:
    """Prepare TF-IDF features and labels."""
    # TF-IDF Vectorization
    vectorizer = TfidfVectorizer(
        max_features=10000,
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.95,
        sublinear_tf=True,
    )

    X = vectorizer.fit_transform(df["text"])

    # Label encoding
    le = LabelEncoder()
    y = le.fit_transform(df["category"])

    print(f"\nFeature matrix shape: {X.shape}")
    print(f"Number of classes: {len(le.classes_)}")
    print(f"Classes: {list(le.classes_)}")

    return X, y, vectorizer, le


def train_and_evaluate(
    X_train, X_test, y_train, y_test,
    label_encoder: LabelEncoder
) -> List[Dict]:
    """Train multiple models and evaluate them."""
    models = {
        "Logistic Regression": LogisticRegression(
            max_iter=1000,
            C=1.0,
            solver="lbfgs",
            multi_class="multinomial",
            random_state=42,
        ),
        "Linear SVM": CalibratedClassifierCV(
            LinearSVC(max_iter=2000, C=1.0, random_state=42),
            cv=3,
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=200,
            max_depth=50,
            min_samples_split=5,
            random_state=42,
            n_jobs=-1,
        ),
    }

    results = []
    best_f1 = 0
    best_model_name = ""

    for name, model in models.items():
        print(f"\n{'='*60}")
        print(f"Training: {name}")
        print(f"{'='*60}")

        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
        f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

        result = {
            "model_name": name,
            "accuracy": round(float(accuracy), 4),
            "precision": round(float(precision), 4),
            "recall": round(float(recall), 4),
            "f1_score": round(float(f1), 4),
            "train_size": len(y_train),
            "test_size": len(y_test),
            "num_classes": len(label_encoder.classes_),
        }

        print(f"Accuracy:  {accuracy:.4f}")
        print(f"Precision: {precision:.4f}")
        print(f"Recall:    {recall:.4f}")
        print(f"F1 Score:  {f1:.4f}")

        # Detailed classification report
        print(f"\nClassification Report:")
        print(classification_report(
            y_test, y_pred,
            target_names=label_encoder.classes_,
            zero_division=0,
        ))

        results.append(result)

        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name

    print(f"\n{'='*60}")
    print(f"BEST MODEL: {best_model_name} (F1: {best_f1:.4f})")
    print(f"{'='*60}")

    return results


def save_artifacts(
    best_model,
    vectorizer: TfidfVectorizer,
    label_encoder: LabelEncoder,
    results: List[Dict],
    output_dir: str,
):
    """Save model artifacts."""
    os.makedirs(output_dir, exist_ok=True)

    # Save model
    model_path = os.path.join(output_dir, "expense_classifier.joblib")
    joblib.dump(best_model, model_path)

    # Save vectorizer
    vec_path = os.path.join(output_dir, "tfidf_vectorizer.joblib")
    joblib.dump(vectorizer, vec_path)

    # Save label encoder
    le_path = os.path.join(output_dir, "label_encoder.joblib")
    joblib.dump(label_encoder, le_path)

    # Save metadata
    metadata = {
        "model_name": "expense_classifier",
        "version": "1.0.0",
        "trained_at": datetime.now().isoformat(),
        "model_type": results[0]["model_name"],
        "features": ["description", "merchant"],
        "vectorizer": "TfidfVectorizer(max_features=10000, ngram_range=(1,2))",
        "metrics": results,
        "num_classes": len(label_encoder.classes_),
        "classes": list(label_encoder.classes_),
    }

    meta_path = os.path.join(output_dir, "classifier_metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nArtifacts saved to {output_dir}")
    print(f"  - model: {model_path}")
    print(f"  - vectorizer: {vec_path}")
    print(f"  - label_encoder: {le_path}")
    print(f"  - metadata: {meta_path}")


def main():
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, "..", "data", "datasets")
    artifacts_dir = os.path.join(script_dir, "..", "artifacts")

    csv_path = os.path.join(data_dir, "financial_transactions.csv")
    if not os.path.exists(csv_path):
        print(f"Dataset not found at {csv_path}")
        print("Run generate_dataset.py first.")
        sys.exit(1)

    # Load data
    df = load_dataset(csv_path)

    # Prepare features
    X, y, vectorizer, le = prepare_features(df)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\nTrain size: {X_train.shape[0]}")
    print(f"Test size:  {X_test.shape[0]}")

    # Train and evaluate
    results = train_and_evaluate(X_train, X_test, y_train, y_test, le)

    # Find best model
    best_result = max(results, key=lambda r: r["f1_score"])
    best_name = best_result["model_name"]

    # Reconstruct best model for saving
    model_map = {
        "Logistic Regression": LogisticRegression(
            max_iter=1000, C=1.0, solver="lbfgs", multi_class="multinomial", random_state=42,
        ),
        "Linear SVM": CalibratedClassifierCV(
            LinearSVC(max_iter=2000, C=1.0, random_state=42), cv=3,
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=200, max_depth=50, min_samples_split=5, random_state=42, n_jobs=-1,
        ),
    }

    best_model = model_map[best_name]
    best_model.fit(X_train, y_train)

    # Save
    save_artifacts(best_model, vectorizer, le, results, artifacts_dir)

    print("\nDone!")


if __name__ == "__main__":
    main()
