"""
Unit Tests for End-to-End Experiment Reproducibility Pipeline
"""

from typing import Any
import json
import os
from scripts.data_generator import generate_synthetic_data
from scripts.eda_report import generate_eda_report
from scripts.model_trainer import train_and_save_model
from scripts.run_ablation import run_full_ablation_suite


def test_reproducible_experiment_artifacts_generation(tmp_path: Any) -> None:
    """Assert that running data generation, training, and ablation deterministically produces required reports"""
    temp_data = str(tmp_path / "clinical_cohort.csv")
    temp_model = str(tmp_path / "model.pkl")
    temp_preprocessor = str(tmp_path / "preprocessor.pkl")
    temp_eda = str(tmp_path / "eda_summary.md")
    temp_error_analysis = str(tmp_path / "error_analysis.md")
    temp_metrics = str(tmp_path / "experiment_metrics.json")

    # Step 1: Deterministic data generation with fixed seed 42
    df = generate_synthetic_data(n_samples=1000, output_path=temp_data, random_seed=42)
    assert os.path.exists(temp_data)
    assert len(df) == 1000

    # Step 2: EDA profiling
    eda_summary = generate_eda_report(data_path=temp_data, output_path=temp_eda)
    assert os.path.exists(temp_eda)
    assert eda_summary["total_records"] == 1000

    # Step 3: Model training
    model, preprocessor = train_and_save_model(
        data_path=temp_data,
        model_filename=temp_model,
        preprocessor_filename=temp_preprocessor,
        random_seed=42,
    )
    assert os.path.exists(temp_model)
    assert os.path.exists(temp_preprocessor)
    assert model is not None
    assert preprocessor is not None

    # Step 4: Multi-seed ablation suite
    ablation_res = run_full_ablation_suite(
        data_path=temp_data,
        seeds=[42, 7],
        output_report_path=temp_error_analysis,
        output_metrics_path=temp_metrics,
    )
    assert os.path.exists(temp_error_analysis)
    assert os.path.exists(temp_metrics)
    assert "empirical_pgx_f1_delta" in ablation_res

    # Validate JSON structure
    with open(temp_metrics, "r", encoding="utf-8") as f:
        metrics_data = json.load(f)
    assert "full_pipeline" in metrics_data
    assert "ablated_pgx_pipeline" in metrics_data
    assert "empirical_pgx_f1_delta" in metrics_data
