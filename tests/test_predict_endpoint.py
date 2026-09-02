"""
Integration Tests for /predict and Inference Endpoints
"""

from typing import Any, Dict

from flask.testing import FlaskClient


def test_predict_endpoint_valid_payload(
    client: FlaskClient, sample_patient: Dict[str, Any]
) -> None:
    """Test POST /predict with a standard valid patient payload"""
    response = client.post("/predict", json=sample_patient)
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "success"
    assert "risk_level" in data
    assert "overall_adr_risk" in data
    assert "predicted_adr_type" in data
    assert "top_specific_adr_risks" in data


def test_predict_endpoint_high_risk_patient(
    client: FlaskClient, sample_high_risk_patient: Dict[str, Any]
) -> None:
    """Test POST /predict with a high risk comorbid patient payload"""
    response = client.post("/predict", json=sample_high_risk_patient)
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "success"
    assert data["risk_level"] in ["High", "Critical"]
    assert data["overall_adr_risk"] > 50.0


def test_predict_endpoint_invalid_json(client: FlaskClient) -> None:
    """Test POST /predict with non-JSON payload returns 400"""
    response = client.post("/predict", data="not json", content_type="text/plain")
    assert response.status_code == 400
    data = response.get_json()
    assert data["status"] == "error"


def test_predict_endpoint_validation_error(client: FlaskClient) -> None:
    """Test POST /predict with invalid field ranges returns 422"""
    invalid_patient = {"age": 150, "creatinine": -2.0}
    response = client.post("/predict", json=invalid_patient)
    assert response.status_code == 422
    data = response.get_json()
    assert data["status"] == "validation_error"


def test_mitigation_strategies_endpoint(client: FlaskClient) -> None:
    """Test POST /mitigation_strategies endpoint"""
    payload = {"prediction_result": {"risk_level": "High", "predicted_adr_type": "Nephrotoxicity"}}
    response = client.post("/mitigation_strategies", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert "mitigation_strategies" in data
    assert len(data["mitigation_strategies"]) > 0


def test_sample_data_endpoint(client: FlaskClient) -> None:
    """Test GET /sample_data/<sample_type> returns pre-built patient records"""
    res_elderly = client.get("/sample_data/elderly_polypharmacy")
    assert res_elderly.status_code == 200
    data = res_elderly.get_json()
    assert data["age"] >= 65


def test_get_drug_adrs_endpoint(client: FlaskClient) -> None:
    """Test GET /get_drug_adrs returns drug-specific risk profiles"""
    response = client.get("/get_drug_adrs?drug=Warfarin")
    assert response.status_code == 200
    data = response.get_json()
    assert data["drug"] == "Warfarin"
    assert "known_adrs" in data
