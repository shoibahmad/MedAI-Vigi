"""
Model Evaluation & Benchmark Report Generator
Evaluates trained HistGradientBoosting model against holdout test partition and outputs markdown summary.
"""

import os
import sys
from typing import Any, Dict

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, f1_score

from utils.model_utils import load_adr_models


def evaluate_model(
    data_path: str = "data/clinical_data.csv",
    model_dir: str = "models",
    output_report_path: str = "reports/model_evaluation_report.md",
) -> Dict[str, Any]:
    """Evaluate trained model on clinical data and export benchmark report"""
    print(f"Evaluating model against {data_path}...")
    model, preprocessor = load_adr_models(model_dir=model_dir)

    df = pd.read_csv(data_path)
    if "indication" not in df.columns:
        df["indication"] = "Hypertension"
    target_col = (
        "adr_risk_label"
        if "adr_risk_label" in df.columns
        else ("adr_type" if "adr_type" in df.columns else "adr_outcome")
    )
    drop_cols = [
        c
        for c in ["time_to_adr_days", "adr_outcome", "adr_type", "adr_risk_label", "weight_kg"]
        if c in df.columns
    ]

    X = df.drop(columns=drop_cols)
    y_true = df[target_col]

    y_pred = model.predict(X)
    acc = accuracy_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred, average="weighted", zero_division=0)
    clf_report = classification_report(y_true, y_pred, zero_division=0)

    print(f"\nModel Accuracy: {acc:.4f}")
    print(f"Weighted F1-Score: {f1:.4f}")
    print("\nClassification Report:\n", clf_report)

    report_content = f"""# PhenoRx Model Benchmark Report

## Overall Metrics
- **Validation Accuracy:** {acc:.4f} ({acc * 100:.2f}%)
- **Weighted F1-Score:** {f1:.4f}
- **Sample Count:** {len(df):,} clinical records

## Classification Breakdown
```text
{clf_report}
```
"""
    os.makedirs(os.path.dirname(output_report_path) or ".", exist_ok=True)
    with open(output_report_path, "w", encoding="utf-8") as f:
        f.write(report_content)

    print(f"[OK] Evaluation report written to {output_report_path}")
    return {"accuracy": acc, "f1_score": f1}


if __name__ == "__main__":
    evaluate_model()
