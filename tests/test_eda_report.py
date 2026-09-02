"""
Unit Tests for Exploratory Data Analysis (EDA) Script
"""

import os
from typing import Any

import pandas as pd

from scripts.eda_report import generate_eda_report


def test_generate_eda_report(tmp_path: Any) -> None:
    """Test that EDA script profiles dataset and outputs structured report"""
    df = pd.DataFrame(
        {
            "age": [25, 45, 65, 80],
            "creatinine": [0.8, 1.2, 2.0, 3.5],
            "egfr": [105.0, 85.0, 45.0, 15.0],
            "cyp2c9": ["Wild", "Intermediate", "Poor", "Wild"],
            "adr_risk_label": ["No ADR", "Hepatotoxicity", "Nephrotoxicity", "No ADR"],
        }
    )
    csv_file = str(tmp_path / "test_cohort.csv")
    report_file = str(tmp_path / "test_eda.md")
    df.to_csv(csv_file, index=False)

    summary = generate_eda_report(data_path=csv_file, output_path=report_file)

    assert summary["total_records"] == 4
    assert summary["features_count"] == 5
    assert os.path.exists(report_file)

    with open(report_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "Exploratory Data Analysis" in content
    assert "adr_risk_label" in content
