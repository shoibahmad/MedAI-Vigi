"""
Unit Tests for Gemini AI Integration Service with Mocked Client
"""

from typing import Any, Dict
from unittest.mock import MagicMock

from services.gemini_service import GeminiService


def test_gemini_service_offline_fallback(
    sample_patient: Dict[str, Any], sample_prediction_result: Dict[str, Any]
) -> None:
    """Test that GeminiService falls back cleanly to rule-based report when offline or API key is absent"""
    service = GeminiService(api_key="", model_name="gemini-2.5-flash")
    assert service.is_available() is False

    report = service.generate_clinical_report(
        patient_data=sample_patient,
        prediction_result=sample_prediction_result,
        patient_name="John Doe",
        clinician_name="Dr. Smith",
    )

    assert report["ai_generated"] is False
    assert report["model"] == "rule-based-fallback"
    assert "John Doe" in report["report"]
    assert "Hepatotoxicity" in report["report"]


def test_gemini_service_mocked_ai_generation(
    sample_patient: Dict[str, Any], sample_prediction_result: Dict[str, Any]
) -> None:
    """Test AI report generation with a mocked Google GenAI client"""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "# Clinical Pharmacovigilance Summary\n\nPatient at elevated risk of ADR."
    mock_client.models.generate_content.return_value = mock_response

    service = GeminiService(api_key="fake-key", model_name="gemini-2.5-flash")
    service.client = mock_client

    report = service.generate_clinical_report(
        patient_data=sample_patient, prediction_result=sample_prediction_result
    )

    assert report["ai_generated"] is True
    assert "elevated risk" in report["report"]


def test_gemini_service_chat_offline_and_mocked() -> None:
    """Test chat assistant in offline and mocked mode"""
    service_offline = GeminiService(api_key="")
    offline_reply = service_offline.chat_response("What is CYP2D6?")
    assert "Offline Mode" in offline_reply

    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "CYP2D6 is a key drug-metabolizing cytochrome P450 enzyme."
    mock_client.models.generate_content.return_value = mock_response

    service_online = GeminiService(api_key="fake-key")
    service_online.client = mock_client
    online_reply = service_online.chat_response("What is CYP2D6?")
    assert "cytochrome P450" in online_reply


def test_gemini_drug_interactions_offline() -> None:
    """Test fallback drug interaction evaluation"""
    service = GeminiService(api_key="")
    res = service.analyze_drug_interactions(["Warfarin", "Amiodarone"])
    assert res["interactions_found"] is True
    assert res["ai_generated"] is False
    assert len(res["interactions"]) > 0


def test_gemini_service_generate_report_exception_fallback(
    sample_patient: Dict[str, Any], sample_prediction_result: Dict[str, Any]
) -> None:
    """Test that runtime API exception in generate_content falls back safely to rule-based report"""
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = RuntimeError("API Quota Exceeded")

    service = GeminiService(api_key="mock-key")
    service.client = mock_client

    report = service.generate_clinical_report(sample_patient, sample_prediction_result)
    assert report["ai_generated"] is False
    assert "fallback_reason" in report
    assert "API Quota" in report["fallback_reason"]


def test_gemini_service_analyze_drug_interactions_mocked() -> None:
    """Test online AI drug interaction analysis with mocked client"""
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = '{"interactions_found": true, "severity": "High", "interactions": []}'
    mock_client.models.generate_content.return_value = mock_resp

    service = GeminiService(api_key="mock-key")
    service.client = mock_client

    res = service.analyze_drug_interactions(["Warfarin", "Aspirin"])
    assert res is not None
