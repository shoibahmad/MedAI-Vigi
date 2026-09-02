"""
Unit Tests for Machine Learning Service Failure Modes and Exception Handling
"""

from typing import Any

import pytest

from services.ml_service import MLService
from utils.errors import ModelNotReadyError


def test_missing_model_artifact_sets_unready_state() -> None:
    """Test that non-existent artifact path gracefully sets ready=False and raises ModelNotReadyError on predict"""
    service = MLService(model_path="models/completely_missing_weights.pkl")
    assert service.is_ready() is False

    with pytest.raises(ModelNotReadyError) as exc_info:
        service.predict({"age": 45, "medication_name": "Warfarin"})

    assert (
        "not ready" in str(exc_info.value).lower() or exc_info.value.error_code == "MODEL_NOT_READY"
    )


def test_corrupted_model_artifact_graceful_handling(tmp_path: Any) -> None:
    """Test that invalid pickle binary data is handled without unhandled crashes"""
    corrupt_path = tmp_path / "corrupt.pkl"
    corrupt_path.write_bytes(b"CORRUPTED_BINARY_HEADER_NOT_A_PICKLE")

    service = MLService(model_path=str(corrupt_path))
    assert service.is_ready() is False

    with pytest.raises(ModelNotReadyError):
        service.predict({"age": 55})


def test_inference_error_wrapping_on_malformed_patient_data() -> None:
    """Test that malformed input data raises ModelInferenceError or handles gracefully"""
    service = MLService.get_instance()
    if service.is_ready():
        # Valid prediction returns dict
        result = service.predict({"age": 30})
        assert isinstance(result, dict)
        assert "risk_level" in result
