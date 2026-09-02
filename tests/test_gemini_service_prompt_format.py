"""
Unit Tests for Gemini Service Clinical Prompt Formatting and Context Serialization
"""

from typing import Any, Dict
from unittest.mock import MagicMock
from services.gemini_service import GeminiService


def test_clinical_prompt_formatting_contains_required_patient_fields(
    sample_patient: Dict[str, Any], sample_prediction_result: Dict[str, Any]
) -> None:
    """Assert prompt constructed for Gemini model contains all demographic, drug, and clinician fields"""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "# Clinical Pharmacovigilance Report\n\nAI summary."
    mock_client.models.generate_content.return_value = mock_response

    service = GeminiService(api_key="mock-key")
    service.client = mock_client

    report = service.generate_clinical_report(
        patient_data=sample_patient,
        prediction_result=sample_prediction_result,
        patient_name="Eleanor Vance",
        clinician_name="Dr. Gregory House",
    )

    assert report["ai_generated"] is True

    # Inspect call arguments to verify prompt content
    call_args, call_kwargs = mock_client.models.generate_content.call_args
    contents = call_kwargs.get("contents") or (call_args[0] if call_args else "")
    prompt_str = str(contents)

    # Assert required clinical fields are in prompt
    assert "Eleanor Vance" in prompt_str
    assert "Dr. Gregory House" in prompt_str
    assert str(sample_patient["age"]) in prompt_str
    assert sample_patient["medication_name"] in prompt_str
    assert sample_prediction_result["risk_level"] in prompt_str
