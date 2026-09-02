"""
Integration Tests for Report and GenAI Blueprints
"""

from typing import Any, Dict

from flask.testing import FlaskClient


def test_generate_report_endpoint(
    client: FlaskClient, sample_patient: Dict[str, Any], sample_prediction_result: Dict[str, Any]
) -> None:
    """Test POST /generate_report returns structured clinical report"""
    payload = {
        "patient_data": sample_patient,
        "prediction_result": sample_prediction_result,
        "patient_name": "Jane Doe",
        "clinician_name": "Dr. Sarah Adams",
    }
    response = client.post("/generate_report", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "success"
    assert "report" in data
    assert len(data["report"]) > 50


def test_generate_detailed_analysis_endpoint(
    client: FlaskClient, sample_patient: Dict[str, Any], sample_prediction_result: Dict[str, Any]
) -> None:
    """Test POST /generate_detailed_analysis returns organ system breakdown"""
    payload = {"patient_data": sample_patient, "prediction_result": sample_prediction_result}
    response = client.post("/generate_detailed_analysis", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "success"
    assert "organ_system_breakdown" in data


def test_analyze_drug_interactions_ai_endpoint(client: FlaskClient) -> None:
    """Test POST /analyze_drug_interactions_ai identifies multi-drug interactions"""
    payload = {"drugs": ["Warfarin", "Amiodarone", "Aspirin"]}
    response = client.post("/analyze_drug_interactions_ai", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert "interactions_found" in data
    assert data["interactions_found"] is True


def test_api_chat_endpoint(client: FlaskClient) -> None:
    """Test POST /api/chat provides conversational pharmacovigilance responses"""
    payload = {
        "message": "What are common signs of statin-induced hepatotoxicity?",
        "context": {"patient_age": 62},
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "success"
    assert "response" in data
    assert len(data["response"]) > 10
