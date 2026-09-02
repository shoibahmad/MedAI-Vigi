import os
from typing import Any

from scripts.data_generator import generate_synthetic_data, load_ml_config


def test_load_ml_config() -> None:
    """Test loading configuration from YAML config file"""
    config = load_ml_config()
    assert "data_generation" in config
    assert "training" in config
    assert config["data_generation"]["random_seed"] == 42


def test_generate_synthetic_data_structure() -> None:
    """Test generating a small batch of synthetic data and checking column types"""
    df = generate_synthetic_data(n_samples=50, random_seed=42)
    assert len(df) == 50
    assert "age" in df.columns
    assert "creatinine" in df.columns
    assert "egfr" in df.columns
    assert "adr_risk_label" in df.columns
    assert df["age"].min() >= 18
    assert df["age"].max() <= 95


def test_clinical_distributions() -> None:
    """Test clinical distributions in synthetic records"""
    df = generate_synthetic_data(n_samples=200, random_seed=42)
    assert set(df["sex"].unique()).issubset({"M", "F"})
    assert set(df["cyp2c9"].unique()).issubset({"Wild", "Intermediate", "Poor", "Rapid"})
    assert "No ADR" in df["adr_risk_label"].values


def test_generate_synthetic_data_file_output(tmp_path: Any) -> None:
    """Test synthetic data CSV file generation and persistence"""
    out_file = str(tmp_path / "cohort_output.csv")
    df = generate_synthetic_data(n_samples=30, output_path=out_file, random_seed=99)
    assert os.path.exists(out_file)
    assert len(df) == 30


def test_load_ml_config_fallback(tmp_path: Any) -> None:
    """Test config loader fallback when YAML is missing"""
    missing_path = str(tmp_path / "non_existent_config.yaml")
    cfg = load_ml_config(config_path=missing_path)
    assert "data_generation" in cfg
    assert cfg["data_generation"]["random_seed"] == 42
