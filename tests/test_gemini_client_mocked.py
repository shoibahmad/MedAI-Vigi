"""
Unit Tests for Gemini AI Client with Mocked Responses
Ensures all GenAI methods, prompt templates, and error fallbacks execute reliably offline.
"""

from typing import Any, Dict
from unittest.mock import MagicMock

from services.gemini_service import GeminiService


def test_gemini_client_generate_content_mocked(
    sample_patient: Dict[str, Any], sample_prediction_result: Dict[str, Any]
) -> None:
    """Test full report generation with mocked google.genai client"""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = """# Executive Clinical Pharmacovigilance Summary
- Risk Level: High
- Suspected Target: Hepatotoxicity
- Recommendation: Baseline liver function test and 50% dose reduction.
"""
    mock_client.models.generate_content.return_value = mock_response

    service = GeminiService(api_key="fake-test-key-12345", model_name="gemini-2.5-flash")
    service.client = mock_client

    report = service.generate_clinical_report(
        patient_data=sample_patient,
        prediction_result=sample_prediction_result,
        patient_name="John Doe",
        clinician_name="Dr. Smith",
    )

    assert report["ai_generated"] is True
    assert report["model"] == "gemini-2.5-flash"
    assert "Hepatotoxicity" in report["report"]
    assert mock_client.models.generate_content.called


def test_gemini_client_api_exception_fallback(
    sample_patient: Dict[str, Any], sample_prediction_result: Dict[str, Any]
) -> None:
    """Test graceful degradation to deterministic fallback when Gemini API raises an exception"""
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = RuntimeError("Quota exceeded / Rate limited")

    service = GeminiService(api_key="fake-test-key-12345")
    service.client = mock_client

    report = service.generate_clinical_report(
        patient_data=sample_patient, prediction_result=sample_prediction_result
    )

    assert report["ai_generated"] is False
    assert "fallback" in report["model"]
    assert "fallback_reason" in report
    assert "Adverse Drug Reaction" in report["report"]


def test_gemini_client_interaction_mocked() -> None:
    """Test drug interaction query with mocked Gemini model response"""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = '{"overall_severity": "Major", "interaction_count": 1, "clinical_summary": "Inhibition of CYP2C9"}'
    mock_client.models.generate_content.return_value = mock_response

    service = GeminiService(api_key="fake-test-key")
    service.client = mock_client

    result = service.analyze_drug_interactions(["Warfarin", "Fluconazole"])
    assert result["ai_generated"] is True
    assert "raw_response" in result
    assert "CYP2C9" in result["raw_response"]
