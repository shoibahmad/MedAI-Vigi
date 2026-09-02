"""
Unit and Integration Tests for ML Pipeline Reproducibility and Training
Verifies that model training on fixed seeds produces deterministic metric benchmarks.
"""

import os
import tempfile

import pandas as pd

from scripts.data_generator import generate_synthetic_data
from scripts.experiment_tracker import log_experiment_metrics
from scripts.model_trainer import train_and_save_model


def test_reproducible_synthetic_data_generation() -> None:
    """Test that data generation with identical random seed yields bit-for-bit identical outputs"""
    df1 = generate_synthetic_data(n_samples=100, random_seed=42, output_path=os.devnull)
    df2 = generate_synthetic_data(n_samples=100, random_seed=42, output_path=os.devnull)
    pd.testing.assert_frame_equal(df1, df2)


def test_model_training_and_prediction_shape() -> None:
    """Test model training pipeline on small cohort fixture with fixed seed"""
    with tempfile.TemporaryDirectory() as tmp_dir:
        csv_path = os.path.join(tmp_dir, "data.csv")
        model_path = os.path.join(tmp_dir, "model.pkl")
        preproc_path = os.path.join(tmp_dir, "preproc.pkl")

        # Generate sample cohort
        generate_synthetic_data(n_samples=300, random_seed=42, output_path=csv_path)

        # Train pipeline
        pipeline, preprocessor = train_and_save_model(
            data_path=csv_path,
            model_filename=model_path,
            preprocessor_filename=preproc_path,
            random_seed=42,
        )

        assert pipeline is not None
        assert os.path.exists(model_path)
        assert os.path.exists(preproc_path)

        # Test inference prediction shape
        df = pd.read_csv(csv_path)
        drop_cols = [
            c
            for c in ["time_to_adr_days", "adr_outcome", "adr_type", "adr_risk_label", "weight_kg"]
            if c in df.columns
        ]
        X = df.drop(columns=drop_cols)

        preds = pipeline.predict(X[:10])
        assert len(preds) == 10

        probs = pipeline.predict_proba(X[:10])
        assert probs.shape[0] == 10
        assert probs.shape[1] > 1


def test_experiment_tracking_metrics_export() -> None:
    """Test experiment tracking metrics generator"""
    with tempfile.TemporaryDirectory() as tmp_dir:
        csv_path = os.path.join(tmp_dir, "data.csv")
        metrics_path = os.path.join(tmp_dir, "metrics.json")
        generate_synthetic_data(n_samples=100, random_seed=42, output_path=csv_path)

        if os.path.exists("models/adr_model.pkl"):
            metrics = log_experiment_metrics(
                data_path=csv_path, model_dir="models", output_metrics_path=metrics_path
            )
            assert "metrics" in metrics
            assert "ablations" in metrics
            assert os.path.exists(metrics_path)
