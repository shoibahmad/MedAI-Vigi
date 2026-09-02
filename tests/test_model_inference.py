"""
Unit and Integration Tests for Machine Learning Inference Service
Tests model prediction probability calibration, feature alignment, and exception handling.
"""

from typing import Any, Dict

import pytest

from services.adr_predictor import ADRPredictor
from services.ml_service import MLService, ModelNotReadyError


def test_adr_predictor_service() -> None:
    """Test ADRPredictor subclass initialization and methods"""
    predictor = ADRPredictor.get_instance()
    assert predictor.is_ready() is True


def test_ml_service_singleton() -> None:
    """Test MLService singleton instance access and model readiness"""
    service1 = MLService.get_instance()
    service2 = MLService.get_instance()
    assert service1 is service2
    assert service1.is_ready() is True
    assert service1.model is not None


def test_prepare_feature_dataframe(sample_patient: Dict[str, Any]) -> None:
    """Test dataframe creation and default feature population"""
    service = MLService.get_instance()
    df = service.prepare_feature_dataframe(sample_patient)
    assert len(df) == 1
    assert "age" in df.columns
    assert "creatinine" in df.columns
    assert df["age"].iloc[0] == 45


def test_model_predict_output_structure(sample_patient: Dict[str, Any]) -> None:
    """Test that ML prediction output returns expected clinical risk keys"""
    service = MLService.get_instance()
    result = service.predict(sample_patient)

    assert "risk_level" in result
    assert result["risk_level"] in ["Low", "Moderate", "High", "Critical"]
    assert "predicted_adr_type" in result
    assert "overall_adr_risk" in result
    assert "no_adr_probability" in result
    assert "top_specific_adr_risks" in result
    assert isinstance(result["top_specific_adr_risks"], dict)
    assert "major_contributing_factors" in result
    assert "pharmacogenomics" in result


def test_model_predict_high_risk_factors(sample_high_risk_patient: Dict[str, Any]) -> None:
    """Test model correctly identifies high risk patient attributes"""
    service = MLService.get_instance()
    result = service.predict(sample_high_risk_patient)

    assert result["risk_level"] in ["High", "Critical"]
    assert result["overall_adr_risk"] > 50.0
    factor_names = [f["factor"] for f in result["major_contributing_factors"]]
    assert any("Renal" in f or "Age" in f or "Liver" in f for f in factor_names)


def test_model_not_ready_error() -> None:
    """Test ModelNotReadyError when model is uninitialized"""
    service = MLService("models/non_existent_model.pkl")
    with pytest.raises(ModelNotReadyError):
        service.predict({"age": 30})


def test_corrupted_model_artifact_handling(tmp_path: Any) -> None:
    """Test that invalid artifact file paths are handled with typed error signals"""
    corrupt_file = tmp_path / "corrupt_model.pkl"
    corrupt_file.write_text("invalid pickle data")

    service = MLService(str(corrupt_file))
    assert service.is_ready() is False
    with pytest.raises(ModelNotReadyError):
        service.predict({"age": 50})
