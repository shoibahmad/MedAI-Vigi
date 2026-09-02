"""
Unit and Integration Tests for Metrics and Prometheus Observability Endpoint
"""

from flask.testing import FlaskClient


def test_metrics_json_endpoint(client: FlaskClient) -> None:
    """Test /metrics default JSON response format"""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert response.is_json

    data = response.get_json()
    assert "app_uptime_seconds" in data
    assert "ml_model_loaded" in data
    assert "gemini_service_active" in data
    assert data["ml_model_loaded"] in (0, 1)


def test_metrics_prometheus_plaintext_format(client: FlaskClient) -> None:
    """Test /metrics Prometheus exposition format when requested with Accept: text/plain"""
    response = client.get("/metrics", headers={"Accept": "text/plain"})
    assert response.status_code == 200
    assert "text/plain" in response.content_type

    text = response.get_data(as_text=True)
    assert "# HELP adr_app_uptime_seconds" in text
    assert "# TYPE adr_app_uptime_seconds gauge" in text
    assert "adr_ml_model_loaded" in text
    assert "adr_predictions_total" in text
