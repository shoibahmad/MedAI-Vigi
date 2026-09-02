"""
Unit Tests for Model Trainer Pipeline and Hyperparameters
"""

import os
import tempfile
from typing import Any

import numpy as np
import pandas as pd

from scripts.model_trainer import train_and_evaluate_model
from scripts.run_ablation import run_full_ablation_suite


def test_train_and_save_model_on_fixture() -> None:
    """Test full training pipeline on synthetic cohort fixture"""
    np.random.seed(42)
    n = 200
    fixture_df = pd.DataFrame(
        {
            "age": np.random.randint(20, 80, size=n),
            "sex": np.random.choice(["M", "F"], size=n),
            "ethnicity": np.random.choice(["Asian", "White", "Black"], size=n),
            "bmi": np.random.uniform(18.0, 35.0, size=n),
            "creatinine": np.random.uniform(0.6, 3.0, size=n),
            "egfr": np.random.uniform(15.0, 110.0, size=n),
            "ast_alt": np.random.uniform(15.0, 150.0, size=n),
            "bilirubin": np.random.uniform(0.3, 3.0, size=n),
            "albumin": np.random.uniform(2.5, 5.0, size=n),
            "cyp2c9": np.random.choice(["Wild", "Intermediate", "Poor"], size=n),
            "cyp2d6": np.random.choice(["EM", "IM", "PM"], size=n),
            "cyp3a4": np.random.choice(["Normal", "Intermediate", "Poor"], size=n),
            "cyp1a2": np.random.choice(["Normal", "Slow"], size=n),
            "cyp2b6": np.random.choice(["Normal", "Poor"], size=n),
            "cyp2c19": np.random.choice(["EM", "IM", "PM"], size=n),
            "medication_name": np.random.choice(["Warfarin", "Metformin", "Simvastatin"], size=n),
            "index_drug_dose": np.random.uniform(1.0, 100.0, size=n),
            "concomitant_drugs_count": np.random.randint(0, 10, size=n),
            "prior_adr_history": np.random.choice([0, 1], size=n),
            "diabetes": np.random.choice([0, 1], size=n),
            "ckd": np.random.choice([0, 1], size=n),
            "cardiac_disease": np.random.choice([0, 1], size=n),
            "liver_disease": np.random.choice([0, 1], size=n),
            "adr_risk_label": np.random.choice(
                ["No ADR", "Hepatotoxicity", "Nephrotoxicity"], size=n
            ),
        }
    )

    with tempfile.TemporaryDirectory() as tmp_dir:
        csv_path = os.path.join(tmp_dir, "test_clinical_data.csv")
        fixture_df.to_csv(csv_path, index=False)

        model_path = os.path.join(tmp_dir, "test_adr_model.pkl")
        preprocessor_path = os.path.join(tmp_dir, "test_preprocessor.pkl")

        pipeline, transformer = train_and_evaluate_model(
            data_path=csv_path, model_save_path=model_path, preprocessor_save_path=preprocessor_path
        )

        assert pipeline is not None
        assert transformer is not None
        assert os.path.exists(model_path)
        assert os.path.exists(preprocessor_path)
        assert os.path.exists("reports/error_analysis.md")
        assert os.path.exists("reports/experiment_metrics.json")


def test_run_full_ablation_suite(tmp_path: Any) -> None:
    """Test empirical multi-seed ablation pipeline on fixture data"""
    np.random.seed(42)
    n = 150
    fixture_df = pd.DataFrame(
        {
            "age": np.random.randint(20, 80, size=n),
            "sex": np.random.choice(["M", "F"], size=n),
            "cyp2c9": np.random.choice(["Wild", "Poor"], size=n),
            "cyp2d6": np.random.choice(["EM", "PM"], size=n),
            "medication_name": np.random.choice(["Warfarin", "Metformin"], size=n),
            "index_drug_dose": np.random.uniform(1.0, 100.0, size=n),
            "adr_risk_label": np.random.choice(["No ADR", "Hepatotoxicity"], size=n),
        }
    )
    csv_path = str(tmp_path / "cohort.csv")
    report_path = str(tmp_path / "error_analysis.md")
    metrics_path = str(tmp_path / "metrics.json")
    fixture_df.to_csv(csv_path, index=False)

    results = run_full_ablation_suite(
        data_path=csv_path,
        seeds=[42, 7],
        output_report_path=report_path,
        output_metrics_path=metrics_path,
    )

    assert "full_pipeline" in results
    assert "ablated_pgx_pipeline" in results
    assert "empirical_pgx_f1_delta" in results
    assert os.path.exists(report_path)
    assert os.path.exists(metrics_path)
