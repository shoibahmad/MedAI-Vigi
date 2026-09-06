"""
Regression tests for /save_assessment.

Saving the same patient twice used to let DuplicateRecordError escape the handler,
which surfaced as a 500. Re-assessing a patient is routine, so the second save
updates the record instead.
"""

from typing import Any, Dict

from flask.testing import FlaskClient

BODY: Dict[str, Any] = {
    "patient_id": "PT-REGRESSION-1",
    "patient_data": {"age": 78, "medication_name": "Warfarin"},
    "prediction": {"risk_level": "Critical", "overall_adr_risk": 96.66},
}


def test_first_save_creates_the_record(client: FlaskClient) -> None:
    response = client.post("/save_assessment", json={**BODY, "patient_id": "PT-CREATE-1"})

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["status"] == "success"
    assert payload["created"] is True
    assert payload["version"] == 1
    assert payload["checksum"]


def test_saving_the_same_patient_twice_updates_instead_of_500(client: FlaskClient) -> None:
    first = client.post("/save_assessment", json={**BODY, "patient_id": "PT-DUP-1"})
    second = client.post("/save_assessment", json={**BODY, "patient_id": "PT-DUP-1"})

    assert first.status_code == 200
    assert second.status_code == 200, "a repeat save must not raise DuplicateRecordError"

    assert first.get_json()["created"] is True
    body = second.get_json()
    assert body["created"] is False
    assert body["version"] == 2


def test_update_reflects_the_new_prediction(client: FlaskClient) -> None:
    client.post(
        "/save_assessment",
        json={**BODY, "patient_id": "PT-UPDATE-1", "prediction": {"risk_level": "Low"}},
    )
    second = client.post(
        "/save_assessment",
        json={**BODY, "patient_id": "PT-UPDATE-1", "prediction": {"risk_level": "Critical"}},
    )

    assert second.status_code == 200
    # The checksum is derived from the stored payload, so it must move when the
    # prediction changes.
    assert second.get_json()["checksum"]
    assert second.get_json()["version"] == 2


def test_validation_still_rejects_a_missing_patient_id(client: FlaskClient) -> None:
    response = client.post(
        "/save_assessment", json={"patient_data": {}, "prediction": {}}
    )

    assert response.status_code == 422
    assert response.get_json()["status"] == "validation_error"
