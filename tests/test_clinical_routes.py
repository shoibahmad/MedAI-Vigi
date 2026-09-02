"""
Integration Tests for Clinical Decision Support Routes
"""

from flask.testing import FlaskClient


def test_get_lab_reference_endpoint(client: FlaskClient) -> None:
    """Test GET /get_lab_reference returns complete reference ranges"""
    response = client.get("/get_lab_reference")
    assert response.status_code == 200
    data = response.get_json()
    assert "lab_ranges" in data
    assert "renal" in data["lab_ranges"]
    assert "liver" in data["lab_ranges"]


def test_get_medication_suggestions_endpoint(client: FlaskClient) -> None:
    """Test GET /get_medication_suggestions returns curated drug list"""
    response = client.get("/get_medication_suggestions")
    assert response.status_code == 200
    drugs = response.get_json()
    assert isinstance(drugs, list)
    assert "Warfarin" in drugs
    assert "Metformin" in drugs


def test_interpret_lab_value_endpoint(client: FlaskClient) -> None:
    """Test POST /interpret_lab_value evaluates single measurement"""
    payload = {"test_name": "creatinine", "value": 2.4, "sex": "M"}
    response = client.post("/interpret_lab_value", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["test_name"] == "creatinine"
    assert len(data["interpretations"]) > 0

    # Bad payload
    bad_res = client.post("/interpret_lab_value", json={"test_name": ""})
    assert bad_res.status_code == 400


def test_enhanced_lab_analysis_endpoint(client: FlaskClient) -> None:
    """Test POST /enhanced_lab_analysis evaluates multi-test panel"""
    panel = {
        "sex": "F",
        "creatinine": 1.4,
        "egfr": 48.0,
        "ast_alt": 65.0,
        "bilirubin": 1.4,
        "albumin": 3.2,
    }
    response = client.post("/enhanced_lab_analysis", json=panel)
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "success"
    assert data["tests_evaluated"] >= 4


def test_upload_liver_function_endpoint(client: FlaskClient) -> None:
    """Test POST /upload_liver_function calculates DILI risk tier"""
    lft_data = {"ast": 180.0, "alt": 210.0, "bilirubin": 3.5, "albumin": 2.8}
    response = client.post("/upload_liver_function", json=lft_data)
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "success"
    assert data["dili_risk_level"] == "High"
    assert data["hy_law_criteria_met"] is True


def test_save_assessment_endpoint(client: FlaskClient) -> None:
    """Test POST /save_assessment persists assessment record"""
    payload = {
        "patient_id": "PATIENT-1001",
        "patient_data": {"age": 55},
        "prediction": {"risk_level": "Low"},
    }
    response = client.post("/save_assessment", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "success"
    assert data["record_id"] == "PATIENT-1001"


def test_submit_counselling_endpoint(client: FlaskClient) -> None:
    """Test POST /api/counselling/submit records pharmacist consultation"""
    payload = {
        "session_type": "Discharge Consultation",
        "counsellor_name": "Dr. Sarah Adams, PharmD",
        "patient_data": {"name": "Robert Taylor"},
    }
    response = client.post("/api/counselling/submit", json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "success"
    assert "Sarah Adams" in data["counsellor"]
